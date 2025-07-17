import { ref, computed, watch } from 'vue';
import { tagStorageService, type Tag } from '@/services/tagStorageService';
import type { Bookmark } from '@/utils/types';

export interface UseTagsOptions {
  bookmarks?: Bookmark[];
  autoLoad?: boolean;
}

export interface UseTagsReturn {
  // 状态
  allTags: Ref<Tag[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  
  // 计算属性
  taggedBookmarksCount: ComputedRef<number>;
  untaggedBookmarksCount: ComputedRef<number>;
  popularTags: ComputedRef<Tag[]>;
  
  // 方法
  loadTags: () => Promise<void>;
  createTag: (tagData: Omit<Tag, 'id' | 'createdAt'>) => Promise<Tag | null>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  loadBookmarkTags: (bookmarks: Bookmark[]) => Promise<Bookmark[]>;
  refreshTags: () => Promise<void>;
}

export function useTags(options: UseTagsOptions = {}) {
  const { bookmarks = [], autoLoad = true } = options;
  
  // 响应式状态
  const allTags = ref<Tag[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // 增强的书签数据（包含标签）
  const enhancedBookmarks = ref<Bookmark[]>([]);

  // 计算属性
  const taggedBookmarksCount = computed(() => {
    return allTags.value.reduce((total, tag) => total + tag.usage, 0);
  });

  const untaggedBookmarksCount = computed(() => {
    return bookmarks.filter(bookmark => !bookmark.tags || bookmark.tags.length === 0).length;
  });

  const popularTags = computed(() => {
    return allTags.value.filter(tag => tag.usage >= 10).sort((a, b) => b.usage - a.usage);
  });

  // 加载所有标签
  const loadTags = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const tags = await tagStorageService.getAllTags();
      allTags.value = tags;
      
      console.log(`加载了 ${tags.length} 个标签`);
    } catch (err: any) {
      console.error('加载标签失败:', err);
      error.value = err.message || '加载标签失败';
    } finally {
      loading.value = false;
    }
  };

  // 创建新标签
  const createTag = async (tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag | null> => {
    try {
      error.value = null;
      
      const newTag = await tagStorageService.saveTag({
        ...tagData,
        createdAt: new Date()
      });
      
      allTags.value.push(newTag);
      console.log('标签创建成功:', newTag);
      
      return newTag;
    } catch (err: any) {
      console.error('创建标签失败:', err);
      error.value = err.message || '创建标签失败';
      return null;
    }
  };

  // 更新标签
  const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag | null> => {
    try {
      error.value = null;
      
      const updatedTag = await tagStorageService.updateTag(id, updates);
      
      const index = allTags.value.findIndex(tag => tag.id === id);
      if (index !== -1) {
        allTags.value[index] = updatedTag;
      }
      
      console.log('标签更新成功:', updatedTag);
      return updatedTag;
    } catch (err: any) {
      console.error('更新标签失败:', err);
      error.value = err.message || '更新标签失败';
      return null;
    }
  };

  // 删除标签
  const deleteTag = async (id: string): Promise<boolean> => {
    try {
      error.value = null;
      
      await tagStorageService.deleteTag(id);
      
      const index = allTags.value.findIndex(tag => tag.id === id);
      if (index !== -1) {
        allTags.value.splice(index, 1);
      }
      
      console.log('标签删除成功:', id);
      return true;
    } catch (err: any) {
      console.error('删除标签失败:', err);
      error.value = err.message || '删除标签失败';
      return false;
    }
  };

  // 为书签加载标签
  const loadBookmarkTags = async (bookmarks: Bookmark[]): Promise<Bookmark[]> => {
    try {
      error.value = null;
      
      const bookmarksWithLoadedTags = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const tags = await tagStorageService.getTagsForBookmark(bookmark.id);
          return {
            ...bookmark,
            tags: tags.map(tag => tag.name)
          };
        })
      );
      
      enhancedBookmarks.value = bookmarksWithLoadedTags;
      return bookmarksWithLoadedTags;
    } catch (err: any) {
      console.error('为书签加载标签失败:', err);
      error.value = err.message || '加载书签标签失败';
      enhancedBookmarks.value = bookmarks;
      return bookmarks;
    }
  };

  // 刷新标签数据
  const refreshTags = async () => {
    await loadTags();
  };

  // 监听书签数据变化，重新加载标签
  watch(() => bookmarks, async (newBookmarks) => {
    if (newBookmarks && newBookmarks.length > 0) {
      await loadBookmarkTags(newBookmarks);
    }
  }, { deep: true });

  // 初始化加载
  if (autoLoad) {
    loadTags();
    if (bookmarks.length > 0) {
      loadBookmarkTags(bookmarks);
    }
  }

  return {
    // 状态
    allTags,
    loading,
    error,
    
    // 计算属性
    taggedBookmarksCount,
    untaggedBookmarksCount,
    popularTags,
    
    // 方法
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    loadBookmarkTags,
    refreshTags
  };
}