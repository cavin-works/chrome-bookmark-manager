import { ref, computed } from 'vue';
import { tagStorageService } from '@/services/tagStorageService';

export interface UseTagDeduplicationReturn {
  // 状态
  isDeduplicating: Ref<boolean>;
  showConfirmDialog: Ref<boolean>;
  showResultDialog: Ref<boolean>;
  result: Ref<{ removedCount: number; mergedRelations: number } | null>;
  
  // 计算属性
  canDeduplicate: ComputedRef<boolean>;
  hasDuplicates: ComputedRef<boolean>;
  
  // 方法
  performDeduplication: () => Promise<void>;
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
  closeResultDialog: () => void;
  resetState: () => void;
}

export function useTagDeduplication() {
  // 响应式状态
  const isDeduplicating = ref(false);
  const showConfirmDialog = ref(false);
  const showResultDialog = ref(false);
  const result = ref<{ removedCount: number; mergedRelations: number } | null>(null);

  // 计算属性（假设外部传入标签数据）
  const canDeduplicate = computed(() => true); // 总是可以执行去重操作
  const hasDuplicates = computed(() => true); // 默认假设可能存在重复

  // 打开确认对话框
  const openConfirmDialog = () => {
    showConfirmDialog.value = true;
  };

  // 关闭确认对话框
  const closeConfirmDialog = () => {
    showConfirmDialog.value = false;
  };

  // 关闭结果对话框
  const closeResultDialog = () => {
    showResultDialog.value = false;
    result.value = null;
  };

  // 执行标签去重
  const performDeduplication = async () => {
    isDeduplicating.value = true;
    
    try {
      // 先检查是否有重复标签
      const allTags = await tagStorageService.getAllTags();
      const tagGroups = new Map<string, string[]>();
      
      // 快速扫描重复标签
      allTags.forEach(tag => {
        const normalizedName = tag.name.toLowerCase().trim();
        if (!tagGroups.has(normalizedName)) {
          tagGroups.set(normalizedName, []);
        }
        tagGroups.get(normalizedName)!.push(tag.id);
      });
      
      const duplicateGroups = Array.from(tagGroups.values()).filter(group => group.length > 1);
      
      if (duplicateGroups.length === 0) {
        // 快速完成：没有重复
        result.value = {
          removedCount: 0,
          mergedRelations: 0,
          details: []
        };
        showConfirmDialog.value = false;
        showResultDialog.value = true;
        return;
      }
      
      // 执行去重
      const deduplicationResult = await tagStorageService.deduplicateTags();
      
      // 保存结果
      result.value = {
        ...deduplicationResult,
        details: duplicateGroups.map(group => ({
          from: group.slice(1).join(', '),
          to: group[0],
          affectedBookmarks: 0 // 需要服务端计算
        }))
      };
      
      // 关闭确认对话框，打开结果对话框
      showConfirmDialog.value = false;
      showResultDialog.value = true;
      
      console.log('标签去重完成:', deduplicationResult);
    } catch (error: any) {
      console.error('标签去重失败:', error);
      
      // 显示错误结果
      result.value = {
        removedCount: 0,
        mergedRelations: 0,
        details: []
      };
      
      showConfirmDialog.value = false;
      showResultDialog.value = true;
    } finally {
      isDeduplicating.value = false;
    }
  };

  // 重置状态
  const resetState = () => {
    isDeduplicating.value = false;
    showConfirmDialog.value = false;
    showResultDialog.value = false;
    result.value = null;
  };

  return {
    // 状态
    isDeduplicating,
    showConfirmDialog,
    showResultDialog,
    result,
    
    // 计算属性
    canDeduplicate,
    hasDuplicates,
    
    // 方法
    performDeduplication,
    openConfirmDialog,
    closeConfirmDialog,
    closeResultDialog,
    resetState
  };
}