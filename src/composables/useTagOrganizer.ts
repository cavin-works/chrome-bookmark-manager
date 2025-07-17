import { ref, computed } from 'vue';
import { aiService } from '@/services/aiService';
import { tagStorageService } from '@/services/tagStorageService';
import type { Bookmark } from '@/utils/types';

export interface UseTagOrganizerOptions {
  bookmarks?: Bookmark[];
  existingTags?: string[];
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  batchSize?: number;
}

export interface OrganizeProgress {
  processed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  message: string;
}

export interface OrganizeResult {
  assignments: { [bookmarkId: string]: string[] };
  newTags: string[];
}

export interface UseTagOrganizerReturn {
  // 状态
  aiOrganizing: Ref<boolean>;
  organizeResult: Ref<OrganizeResult | null>;
  organizeConfigError: Ref<string>;
  organizeProgress: Ref<OrganizeProgress>;
  
  // 计算属性
  canOrganize: ComputedRef<boolean>;
  hasUntaggedBookmarks: ComputedRef<boolean>;
  untaggedCount: ComputedRef<number>;
  totalToOrganize: ComputedRef<number>;
  
  // 方法
  startAIOrganize: () => Promise<void>;
  retryAIOrganize: () => Promise<void>;
  confirmAIOrganize: (result: OrganizeResult) => Promise<void>;
  setApiConfig: (config: { apiKey?: string; apiUrl?: string; model?: string }) => void;
}

export function useTagOrganizer(options: UseTagOrganizerOptions = {}) {
  const { bookmarks = [], existingTags = [], batchSize = 30 } = options;
  
  // 响应式状态
  const aiOrganizing = ref(false);
  const organizeResult = ref<OrganizeResult | null>(null);
  const organizeConfigError = ref('');
  const organizeProgress = ref<OrganizeProgress>({
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    batchSize: batchSize,
    message: 'AI 正在分析书签并分配标签...'
  });
  
  // API配置
  const apiConfig = ref({
    apiKey: options.apiKey || '',
    apiUrl: options.apiUrl || 'https://api.openai.com/v1',
    model: options.model || 'gpt-3.5-turbo'
  });

  // 计算属性
  const canOrganize = computed(() => 
    bookmarks.length > 0 && 
    !!apiConfig.value.apiKey && 
    !!apiConfig.value.apiUrl
  );
  
  const hasUntaggedBookmarks = computed(() => 
    bookmarks.filter(bookmark => !bookmark.tags || bookmark.tags.length === 0).length > 0
  );
  
  // 使用useTags中的计算，避免重复计算
  const untaggedCount = computed(() => {
    // 这个计算将由useTags提供，这里返回0避免冲突
    return 0;
  });
  
  const totalToOrganize = computed(() => 
    organizeResult.value ? Object.keys(organizeResult.value.assignments).length : 0
  );

  // 加载AI设置
  const loadAISettings = async () => {
    try {
      const stored = localStorage.getItem('humi-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          apiKey: settings.aiApiKey || '',
          apiUrl: settings.aiApiUrl || 'https://api.openai.com/v1',
          model: settings.aiModel || 'gpt-3.5-turbo'
        };
      }
      return apiConfig.value;
    } catch (error) {
      console.error('加载AI设置失败:', error);
      return apiConfig.value;
    }
  };

  // 开始AI整理
  const startAIOrganize = async () => {
    aiOrganizing.value = true;
    organizeResult.value = null;
    organizeConfigError.value = '';

    try {
      const bookmarkData = bookmarks.filter(bookmark => 
        !bookmark.tags || bookmark.tags.length === 0
      );

      if (bookmarkData.length === 0) {
        throw new Error('没有未标签的书签可供整理');
      }

      // 加载和验证AI配置
      const aiSettings = await loadAISettings();
      
      if (!aiSettings.apiKey || !aiSettings.apiUrl) {
        organizeConfigError.value = 'AI 配置不完整，请在设置页面配置 API 地址和密钥';
        return;
      }

      // 配置AI服务
      aiService.setApiKey(aiSettings.apiKey);
      aiService.setBaseUrl(aiSettings.apiUrl);
      aiService.setModel(aiSettings.model);

      // 动态计算批次大小
      const dynamicBatchSize = bookmarkData.length > 100 ? 25 : batchSize;
      const totalBatches = Math.ceil(bookmarkData.length / dynamicBatchSize);

      // 更新进度信息
      organizeProgress.value = {
        processed: 0,
        total: bookmarkData.length,
        currentBatch: 0,
        totalBatches,
        batchSize: dynamicBatchSize,
        message: totalBatches > 1 
          ? `准备分批处理 ${bookmarkData.length} 个书签...`
          : '正在分析书签内容...'
      };

      // 调用AI服务整理书签
      const result = await aiService.organizeBookmarksWithTags(
        bookmarkData,
        existingTags,
        {
          batchSize: dynamicBatchSize,
          onProgress: (processed: number, total: number, currentBatch: number) => {
            organizeProgress.value.processed = processed;
            organizeProgress.value.total = total;
            organizeProgress.value.currentBatch = currentBatch;
            
            if (totalBatches > 1) {
              organizeProgress.value.message = `正在处理第 ${currentBatch}/${totalBatches} 批书签...`;
            } else {
              organizeProgress.value.message = '正在分析书签并生成标签建议...';
            }
          }
        }
      );

      // 预处理结果：过滤已存在的标签
      const filteredNewTags = result.newTags.filter(tagName =>
        !existingTags.includes(tagName)
      );

      organizeResult.value = {
        assignments: result.assignments,
        newTags: filteredNewTags
      };

      organizeProgress.value.message = `整理完成！为 ${Object.keys(result.assignments).length} 个书签分配了标签`;

    } catch (error: any) {
      console.error('AI 整理书签失败:', error);

      // 错误处理
      if (error.message.includes('没有可用的书签数据')) {
        organizeConfigError.value = '暂无书签数据可供整理';
      } else if (error.message.includes('API密钥未设置') || error.message.includes('AI 配置不完整')) {
        organizeConfigError.value = '请先在设置页面配置 AI API 地址和密钥';
      } else if (error.message.includes('API请求失败')) {
        organizeConfigError.value = 'AI 服务连接失败，请检查网络连接和 API 配置';
      } else {
        organizeConfigError.value = `整理失败: ${error.message}`;
      }
    } finally {
      aiOrganizing.value = false;
    }
  };

  // 重试AI整理
  const retryAIOrganize = async () => {
    organizeConfigError.value = '';
    await startAIOrganize();
  };

  // 确认AI整理结果
  const confirmAIOrganize = async (result: OrganizeResult) => {
    try {
      // 显示应用进度
      organizeProgress.value.message = '正在应用整理结果...';
      organizeProgress.value.processed = 0;
      organizeProgress.value.total = Object.keys(result.assignments).length + result.newTags.length;

      // 1. 创建新推荐的标签
      organizeProgress.value.message = '正在创建新标签...';
      const tagCreationResult = await tagStorageService.createTagsBatch(result.newTags);

      // 2. 创建标签名称到ID的映射
      const allTags = await tagStorageService.getAllTags();
      const tagNameToId = new Map<string, string>();
      allTags.forEach(tag => {
        tagNameToId.set(tag.name, tag.id);
      });

      // 3. 转换分配结果为标签ID格式
      const assignmentsWithIds: { [bookmarkId: string]: string[] } = {};
      Object.entries(result.assignments).forEach(([bookmarkId, tagNames]) => {
        const tagIds = tagNames
          .map(tagName => tagNameToId.get(tagName))
          .filter((tagId): tagId is string => tagId !== undefined);

        if (tagIds.length > 0) {
          assignmentsWithIds[bookmarkId] = tagIds;
        }
      });

      // 4. 批量分配标签到书签
      organizeProgress.value.message = '正在应用标签分配...';
      await tagStorageService.batchAssignTags(assignmentsWithIds);

      // 5. 完成
      organizeProgress.value.message = '整理结果应用完成！';
      
      // 清理状态
      organizeResult.value = null;
      organizeConfigError.value = '';

      console.log(`AI 整理完成：为 ${Object.keys(result.assignments).length} 个书签分配了标签，新增了 ${tagCreationResult.created.length} 个标签`);

    } catch (error) {
      console.error('确认整理失败:', error);
      organizeConfigError.value = '应用整理结果失败，请重试';
      organizeProgress.value.message = '应用整理结果时出现错误';
      throw error;
    }
  };

  // 设置API配置
  const setApiConfig = (config: { apiKey?: string; apiUrl?: string; model?: string }) => {
    apiConfig.value = { ...apiConfig.value, ...config };
  };

  return {
    // 状态
    aiOrganizing,
    organizeResult,
    organizeConfigError,
    organizeProgress,
    
    // 计算属性
    canOrganize,
    hasUntaggedBookmarks,
    untaggedCount,
    totalToOrganize,
    
    // 方法
    startAIOrganize,
    retryAIOrganize,
    confirmAIOrganize,
    setApiConfig
  };
}