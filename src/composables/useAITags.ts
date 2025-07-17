import { ref, computed } from 'vue';
import { aiService } from '@/services/aiService';
import type { Bookmark } from '@/utils/types';

export interface UseAITagsOptions {
  bookmarks?: Bookmark[];
  existingTags?: string[];
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}

export interface UseAITagsReturn {
  // AI生成状态
  aiGenerating: Ref<boolean>;
  recommendedTags: Ref<string[]>;
  selectedRecommendedTags: Ref<string[]>;
  aiConfigError: Ref<string>;
  
  // 计算属性
  canGenerate: ComputedRef<boolean>;
  hasRecommendations: ComputedRef<boolean>;
  selectedCount: ComputedRef<number>;
  
  // 方法
  generateAITags: () => Promise<void>;
  regenerateAITags: () => Promise<void>;
  retryAIGeneration: () => Promise<void>;
  toggleTagSelection: (tag: string) => void;
  selectAllTags: () => void;
  clearAllTags: () => void;
  removeSelectedTag: (tag: string) => void;
  confirmAITags: () => Promise<{ created: string[], skipped: string[] }>;
  setApiConfig: (config: { apiKey?: string; apiUrl?: string; model?: string }) => void;
}

export function useAITags(options: UseAITagsOptions = {}) {
  const { bookmarks = [], existingTags = [] } = options;
  
  // 响应式状态
  const aiGenerating = ref(false);
  const recommendedTags = ref<string[]>([]);
  const selectedRecommendedTags = ref<string[]>([]);
  const aiConfigError = ref('');
  
  // API配置
  const apiConfig = ref({
    apiKey: options.apiKey || '',
    apiUrl: options.apiUrl || 'https://api.openai.com/v1',
    model: options.model || 'gpt-3.5-turbo'
  });

  // 计算属性
  const canGenerate = computed(() => 
    bookmarks.length > 0 && 
    !!apiConfig.value.apiKey && 
    !!apiConfig.value.apiUrl
  );
  
  const hasRecommendations = computed(() => recommendedTags.value.length > 0);
  const selectedCount = computed(() => selectedRecommendedTags.value.length);

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

  // 生成AI标签
  const generateAITags = async () => {
    aiGenerating.value = true;
    recommendedTags.value = [];
    selectedRecommendedTags.value = [];
    aiConfigError.value = '';

    try {
      const bookmarkData = bookmarks;
      
      if (bookmarkData.length === 0) {
        throw new Error('没有可用的书签数据');
      }

      // 加载和验证AI配置
      const aiSettings = await loadAISettings();
      
      if (!aiSettings.apiKey || !aiSettings.apiUrl) {
        aiConfigError.value = 'AI 配置不完整，请在设置页面配置 API 地址和密钥';
        return;
      }

      // 配置AI服务
      aiService.setApiKey(aiSettings.apiKey);
      aiService.setBaseUrl(aiSettings.apiUrl);
      aiService.setModel(aiSettings.model);

      // 调用AI服务生成标签
      const generated = await aiService.generateTagsFromBookmarks(
        bookmarkData, 
        existingTags
      );
      
      recommendedTags.value = generated;
    } catch (error: any) {
      console.error('AI 生成标签失败:', error);
      
      // 错误处理
      if (error.message.includes('没有可用的书签数据')) {
        aiConfigError.value = '暂无书签数据可供分析';
      } else if (error.message.includes('API密钥未设置') || error.message.includes('AI 配置不完整')) {
        aiConfigError.value = '请先在设置页面配置 AI API 地址和密钥';
      } else if (error.message.includes('API请求失败')) {
        aiConfigError.value = 'AI 服务连接失败，请检查网络连接和 API 配置';
      } else {
        // 提供默认推荐
        const defaultRecommendations = ['工具', '学习', '开发', '设计', '文档', '资源', '社区', '新闻'];
        recommendedTags.value = defaultRecommendations.filter(tag => !existingTags.includes(tag));
      }
    } finally {
      aiGenerating.value = false;
    }
  };

  // 重新生成标签
  const regenerateAITags = async () => {
    await generateAITags();
  };

  // 重试生成
  const retryAIGeneration = async () => {
    aiConfigError.value = '';
    await generateAITags();
  };

  // 标签选择操作
  const toggleTagSelection = (tag: string) => {
    const index = selectedRecommendedTags.value.indexOf(tag);
    if (index > -1) {
      selectedRecommendedTags.value.splice(index, 1);
    } else {
      selectedRecommendedTags.value.push(tag);
    }
  };

  const selectAllTags = () => {
    selectedRecommendedTags.value = [...recommendedTags.value];
  };

  const clearAllTags = () => {
    selectedRecommendedTags.value = [];
  };

  const removeSelectedTag = (tag: string) => {
    const index = selectedRecommendedTags.value.indexOf(tag);
    if (index > -1) {
      selectedRecommendedTags.value.splice(index, 1);
    }
  };

  // 确认创建AI标签
  const confirmAITags = async (): Promise<{ created: string[], skipped: string[] }> => {
    try {
      // 这里需要导入 tagStorageService，但为了避免循环依赖，我们返回标签列表
      const tagsToCreate = selectedRecommendedTags.value;
      
      // 重置状态
      recommendedTags.value = [];
      selectedRecommendedTags.value = [];
      
      // 返回结果供外部处理
      return {
        created: tagsToCreate,
        skipped: []
      };
    } catch (error: any) {
      console.error('确认AI标签失败:', error);
      throw error;
    }
  };

  // 设置API配置
  const setApiConfig = (config: { apiKey?: string; apiUrl?: string; model?: string }) => {
    apiConfig.value = { ...apiConfig.value, ...config };
  };

  return {
    // 状态
    aiGenerating,
    recommendedTags,
    selectedRecommendedTags,
    aiConfigError,
    
    // 计算属性
    canGenerate,
    hasRecommendations,
    selectedCount,
    
    // 方法
    generateAITags,
    regenerateAITags,
    retryAIGeneration,
    toggleTagSelection,
    selectAllTags,
    clearAllTags,
    removeSelectedTag,
    confirmAITags,
    setApiConfig
  };
}