<template>
  <div :class="cn('min-h-screen bg-background text-foreground', isDarkMode && 'dark')">
    <!-- Stagewise Toolbar - 仅在开发模式下显示 -->
    <StagewiseToolbar v-if="isDev" :config="stageWiseConfig" />

    <!-- Toast Provider -->
    <ToastProvider>
      <div class="flex h-screen flex-col">
        <!-- 导航栏 -->
        <AppNavigation
          :theme="theme"
          @toggle-theme="toggleTheme"
          @add-bookmark="showAddBookmark = true"
        />

        <!-- 主内容 -->
        <div class="flex flex-1 overflow-hidden">
          <!-- 侧边栏 -->
          <Sidebar
            v-if="$route.path === '/'"
            :bookmarks="bookmarks"
            :bookmark-folders="bookmarkFolders"
            :selected-folder="selectedFolder"
            :collapsed="sidebarCollapsed"
            @select-folder="selectFolder"
            @add-folder="showAddFolder = true"
            @collapse="sidebarCollapsed = $event"
            @reorder="handleFolderReorder"
          />

          <!-- 内容区域 -->
          <main class="flex-1 overflow-hidden">
            <ScrollArea class="h-full">
              <!-- 路由视图 -->
              <RouterView
                :bookmarks="bookmarks"
                :bookmark-folders="bookmarkFolders"
                :selected-folder="selectedFolder"
                :loading="loading"
                @add-bookmark="showAddBookmark = true"
                @open-bookmark="openBookmark"
                @edit-bookmark="editBookmark"
                @delete-bookmark="deleteBookmark"
                @load-more="handleLoadMore"
              />
            </ScrollArea>
          </main>
        </div>

        <!-- 对话框组件 -->
        <BookmarkFormDialog
          v-model:show="showAddBookmark"
          :category-options="categoryOptions"
          :folder-options="folderOptions"
          :editing-bookmark="editingBookmark"
          :bookmark-id="editingBookmark ? getBookmarkIdFromEditingData() : undefined"
          @confirm="handleBookmarkSubmit"
        />

        <AddFolderDialog
          v-model:show="showAddFolder"
          :folder-options="folderOptions"
          @confirm="addFolder"
        />

        <SettingsDialog
          v-model:show="showSettings"
          :settings="settings"
          @confirm="saveSettings"
        />

        <!-- 删除确认对话框 -->
        <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
          <AlertDialogContent class="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle class="flex items-center gap-2 text-destructive">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                确认删除
              </AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除书签"<strong>{{ bookmarkToDelete?.title }}</strong>"吗？
                <br /><br />
                <span class="text-destructive text-sm">
                  ⚠️ 此操作无法撤销。
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter class="gap-2">
              <AlertDialogCancel>
                取消
              </AlertDialogCancel>
              <AlertDialogAction
                @click="confirmDeleteBookmark"
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Toaster />
    </ToastProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { StagewiseToolbar } from '@stagewise/toolbar-vue';
import { VuePlugin } from '@stagewise-plugins/vue';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast/use-toast';

import { Bookmark, UserSettings } from '../utils/types';
import { bookmarkService } from '../services/bookmarkService';
import { iconService } from '../services/iconService';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { tagStorageService } from '../services/tagStorageService';
import { debounce, getSystemTheme } from '../utils/helpers';
import { getDefaultIcon as getDefaultIconUtil } from '../utils/defaultIcon';

// 组件导入
import AppNavigation from '../components/AppNavigation.vue';
import Sidebar from '../components/Sidebar.vue';
import BookmarkFormDialog from '../components/BookmarkFormDialog.vue';
import AddFolderDialog from '../components/AddFolderDialog.vue';
import SettingsDialog from '../components/SettingsDialog.vue';

// 响应式数据
const bookmarks = ref<Bookmark[]>([]);
const bookmarkFolders = ref<Bookmark[]>([]);
const loading = ref(true);
const selectedFolder = ref('');
const sidebarCollapsed = ref(false);
const theme = ref<'light' | 'dark' | 'auto'>('auto');
const showAddBookmark = ref(false);
const showAddFolder = ref(false);
const showSettings = ref(false);
const showDeleteConfirm = ref(false);
const bookmarkToDelete = ref<Bookmark | null>(null);
const editingBookmark = ref<any>(null);
const settings = ref<UserSettings>({
  theme: 'auto',
  layout: 'grid',
  showTags: true,
  showDescriptions: true,
  autoCategorize: true,
});

// Toast
const { toast } = useToast();

// 获取默认图标URL的工具函数
const getDefaultIcon = (): string => {
  return getDefaultIconUtil();
};

// Stagewise 配置
const isDev = ref(import.meta.env.DEV);
const stageWiseConfig = ref({
  plugins: [VuePlugin],
});

// 计算属性
const isDarkMode = computed(() => {
  if (theme.value === 'auto') {
    return getSystemTheme() === 'dark';
  }
  return theme.value === 'dark';
});

// 获取AI分类（用于下拉选择）
const categories = computed(() => {
  const categorySet = new Set<string>();

  // 添加AI分类
  bookmarks.value.forEach(bookmark => {
    if (bookmark.category) {
      categorySet.add(bookmark.category);
    }
  });

  return Array.from(categorySet).sort();
});

// 分类选项
const categoryOptions = computed(() => [
  { label: '自动分类', value: 'auto' },
  ...categories.value.map(category => ({ label: category, value: category }))
]);

// 文件夹选项
const folderOptions = computed(() => [
  { label: '默认位置', value: 'default' },
  ...bookmarkFolders.value
    .filter(folder => folder.title && folder.title.trim() !== '')
    .map(folder => ({ label: folder.title, value: folder.id }))
]);


// 方法
const selectFolder = (folderId: string) => {
  selectedFolder.value = folderId;
};

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  settings.value.theme = theme.value;
  saveSettings(settings.value);
};

const openBookmark = (bookmark: Bookmark) => {
  if (bookmark.url) {
    window.open(bookmark.url, '_blank');
  }
};

const editBookmark = (bookmark: Bookmark) => {
  editingBookmark.value = {
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || '',
    category: bookmark.category || '',
    parentId: bookmark.parentId || ''
  };
  showAddBookmark.value = true;
};

const deleteBookmark = async (bookmark: Bookmark) => {
  bookmarkToDelete.value = bookmark;
  showDeleteConfirm.value = true;
};

const confirmDeleteBookmark = async () => {
  if (!bookmarkToDelete.value) return;

  try {
    await bookmarkService.deleteBookmark(bookmarkToDelete.value.id);
    await loadBookmarks();
    toast({
      title: "删除成功",
      description: "书签已删除",
    });
  } catch (error) {
    console.error('删除书签失败:', error);
    toast({
      title: "删除失败",
      description: "删除书签失败，请重试",
      variant: "destructive",
    });
  } finally {
    showDeleteConfirm.value = false;
    bookmarkToDelete.value = null;
  }
};

const handleBookmarkSubmit = async (formData: any) => {
  if (editingBookmark.value) {
    await updateBookmark(formData);
  } else {
    await addBookmark(formData);
  }
  editingBookmark.value = null;
};

// 获取编辑书签的ID
const getBookmarkIdFromEditingData = (): string | undefined => {
  if (!editingBookmark.value) return undefined;
  
  // 根据标题和URL查找书签ID
  const bookmark = bookmarks.value.find(b => 
    b.title === editingBookmark.value?.title && 
    b.url === editingBookmark.value?.url
  );
  
  return bookmark?.id;
};

const addBookmark = async (formData: any) => {
  try {
    const bookmarkData = {
      title: formData.title,
      url: formData.url,
      parentId: (formData.parentId && formData.parentId !== 'default') ? formData.parentId : undefined,
    };

    const bookmark = await bookmarkService.createBookmark(bookmarkData);

    // AI自动分类
    if (settings.value.autoCategorize && (!formData.category || formData.category === 'auto')) {
      try {
        const aiResult = await aiService.categorizeBookmark(bookmark);
        bookmark.category = aiResult.category;
        bookmark.tags = aiResult.tags;
        bookmark.description = aiResult.description;

        // 更新书签
        await bookmarkService.updateBookmark(bookmark.id, {
          title: bookmark.title,
          url: bookmark.url,
        });
      } catch (error) {
        console.error('AI分类失败:', error);
      }
    }

    // 分配选中的标签
    if (formData.tagIds && formData.tagIds.length > 0) {
      try {
        await tagStorageService.assignTagsToBookmark(bookmark.id, formData.tagIds);
      } catch (error) {
        console.error('分配标签失败:', error);
      }
    }

    await loadBookmarks();
    toast({
      title: "添加成功",
      description: "书签已添加",
    });
  } catch (error) {
    console.error('添加书签失败:', error);
    toast({
      title: "添加失败",
      description: "添加书签失败，请重试",
      variant: "destructive",
    });
  }
};

const updateBookmark = async (formData: any) => {
  try {
    const bookmarkData = {
      title: formData.title,
      url: formData.url,
      parentId: (formData.parentId && formData.parentId !== 'default') ? formData.parentId : undefined,
    };

    // 找到要编辑的书签ID
    const originalBookmark = bookmarks.value.find(b => 
      b.title === editingBookmark.value.title && 
      b.url === editingBookmark.value.url
    );
    
    if (originalBookmark) {
      await bookmarkService.updateBookmark(originalBookmark.id, bookmarkData);
      
      // 更新标签分配
      if (formData.tagIds) {
        try {
          await tagStorageService.assignTagsToBookmark(originalBookmark.id, formData.tagIds);
        } catch (error) {
          console.error('更新标签失败:', error);
        }
      }
      
      await loadBookmarks();
      toast({
        title: "更新成功",
        description: "书签已更新",
      });
    }
  } catch (error) {
    console.error('更新书签失败:', error);
    toast({
      title: "更新失败",
      description: "更新书签失败，请重试",
      variant: "destructive",
    });
  }
};

const addFolder = async (formData: any) => {
  try {
    const folder = await bookmarkService.createFolder(
      formData.title,
      (formData.parentId && formData.parentId !== 'default') ? formData.parentId : undefined
    );

    await loadBookmarks();
    toast({
      title: "创建成功",
      description: "文件夹已创建",
    });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    toast({
      title: "创建失败",
      description: "创建文件夹失败，请重试",
      variant: "destructive",
    });
  }
};

// 优化的图标加载，避免重复请求
const loadBookmarkIcons = async (bookmarkList: Bookmark[]) => {
  console.log('开始后台加载图标...');

  // 过滤出需要加载图标的书签（没有图标或使用默认图标的）
  const defaultIcon = getDefaultIcon();
  const bookmarksNeedingIcons = bookmarkList.filter(bookmark =>
    bookmark.url &&
    (!bookmark.icon || bookmark.icon === defaultIcon)
  );

  if (bookmarksNeedingIcons.length === 0) {
    console.log('所有书签都已有图标，跳过加载');
    return;
  }

  console.log(`需要加载图标的书签数量: ${bookmarksNeedingIcons.length}`);

  // 使用 iconService 的批量加载功能
  try {
    const urls = bookmarksNeedingIcons.map(bookmark => bookmark.url!);
    const iconResults = await iconService.getBatchIcons(urls);

    // 更新书签图标
    bookmarksNeedingIcons.forEach(bookmark => {
      const iconUrl = iconResults[bookmark.url!];
      if (iconUrl) {
        // 找到对应的书签并更新图标
        const bookmarkIndex = bookmarks.value.findIndex(b => b.id === bookmark.id);
        if (bookmarkIndex !== -1) {
          bookmarks.value[bookmarkIndex].icon = iconUrl;
        }
      }
    });

    console.log('批量图标加载完成');
  } catch (error) {
    console.error('批量图标加载失败:', error);

    // 降级到逐个加载（更小的批次）
    const batchSize = 3;
    for (let i = 0; i < bookmarksNeedingIcons.length; i += batchSize) {
      const batch = bookmarksNeedingIcons.slice(i, i + batchSize);

      const iconPromises = batch.map(async (bookmark) => {
        try {
          const icon = await iconService.getBookmarkIcon(bookmark.url!);
          // 找到对应的书签并更新图标
          const bookmarkIndex = bookmarks.value.findIndex(b => b.id === bookmark.id);
          if (bookmarkIndex !== -1) {
            bookmarks.value[bookmarkIndex].icon = icon;
          }
        } catch (error: any) {
          console.warn('加载图标失败:', bookmark.title, bookmark.url, error?.message || error);
          // 保持默认图标，不做处理
        }
      });

      await Promise.all(iconPromises);

      // 每批之间稍微延迟，避免过度占用资源
      if (i + batchSize < bookmarksNeedingIcons.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('逐个图标加载完成');
  }
};

// 加载书签数据但不加载图标（用于重新排序等场景）
const loadBookmarksWithoutIcons = async () => {
  try {
    console.log('开始加载书签数据（不含图标）...');

    // 加载书签树
    const bookmarkTree = await bookmarkService.getBookmarkTree();
    console.log('获取到书签树:', bookmarkTree);

    // 提取所有书签
    const allBookmarks = await bookmarkService.getAllBookmarks();
    console.log('获取到书签数量:', allBookmarks.length);

    // 提取文件夹
    const folders = await bookmarkService.getBookmarkFolders();
    console.log('获取到文件夹数量:', folders.length);

    // 清理文件夹数据，过滤掉无效的文件夹
    const cleanedFolders = folders.filter(folder => {
      // 过滤掉没有title或title为空的文件夹
      if (!folder.title || folder.title.trim() === '') {
        console.warn('发现空标题文件夹:', folder);
        return false;
      }
      return true;
    });
    console.log('清理后文件夹数量:', cleanedFolders.length);

    // 设置默认图标（如果没有图标）
    const defaultIcon = getDefaultIcon();
    allBookmarks.forEach(bookmark => {
      if (bookmark.url && !bookmark.icon) {
        bookmark.icon = defaultIcon; // 设置默认图标
      }
    });

    // 立即设置书签数据，让页面先渲染
    bookmarks.value = allBookmarks;
    bookmarkFolders.value = cleanedFolders;

    console.log('书签和文件夹数据加载完成（无图标）');
  } catch (error) {
    console.error('加载书签数据失败:', error);
    throw error;
  }
};

const loadBookmarks = async () => {
  try {
    loading.value = true;
    console.log('开始加载书签...');

    // 先加载基础数据
    await loadBookmarksWithoutIcons();

    // 后台异步加载图标
    loadBookmarkIcons(bookmarks.value);
    console.log('书签和文件夹加载完成');
  } catch (error) {
    console.error('加载书签失败:', error);
    // 添加一些示例数据用于测试
    bookmarks.value = [
      {
        id: '1',
        title: 'Google',
        url: 'https://www.google.com',
        dateAdded: Date.now(),
        icon: 'https://www.google.com/favicon.ico',
        category: '工具',
        tags: ['搜索', '工具']
      },
      {
        id: '2',
        title: 'GitHub',
        url: 'https://github.com',
        dateAdded: Date.now() - 86400000,
        icon: 'https://github.com/favicon.ico',
        category: '技术',
        tags: ['编程', '开源']
      }
    ];

    bookmarkFolders.value = [
      {
        id: 'folder1',
        title: '书签栏',
        parentId: '0',
        dateAdded: Date.now(),
        children: []
      },
      {
        id: 'folder2',
        title: '其他书签',
        parentId: '0',
        dateAdded: Date.now(),
        children: []
      }
    ];
  } finally {
    loading.value = false;
  }
};

// 处理加载更多
const handleLoadMore = () => {
  console.log('触发加载更多事件');
  // 这里可以添加加载更多的逻辑，比如性能优化、缓存等
  // 目前BookmarkGrid组件内部已经处理了分页逻辑
};

// 处理文件夹重新排序（优化：只重新加载数据结构，不重复加载图标）
const handleFolderReorder = async () => {
  console.log('文件夹已重新排序，重新加载数据...');
  try {
    // 保存当前的图标状态
    const currentIcons = new Map(
      bookmarks.value.map(bookmark => [bookmark.id, bookmark.icon])
    );

    // 重新加载书签和文件夹数据
    await loadBookmarksWithoutIcons();

    // 恢复图标状态
    const defaultIcon = getDefaultIcon();
    bookmarks.value.forEach(bookmark => {
      const savedIcon = currentIcons.get(bookmark.id);
      if (savedIcon && savedIcon !== defaultIcon) {
        bookmark.icon = savedIcon;
      }
    });

    toast({
      title: "排序成功",
      description: "文件夹排序已更新",
    });
  } catch (error) {
    console.error('重新加载数据失败:', error);
    toast({
      title: "更新失败",
      description: "更新数据失败，请重试",
      variant: "destructive",
    });
  }
};

const loadSettings = async () => {
  try {
    console.log('开始加载设置...');
    const savedSettings = await storageService.getSettings();
    settings.value = savedSettings;
    theme.value = savedSettings.theme;

    // 设置AI服务API密钥
    if (savedSettings.aiApiKey) {
      aiService.setApiKey(savedSettings.aiApiKey);
    }

    console.log('设置加载完成');
  } catch (error) {
    console.error('加载设置失败:', error);
    // 使用默认设置
    settings.value = {
      theme: 'auto',
      layout: 'grid',
      showTags: true,
      showDescriptions: true,
      autoCategorize: true,
    };
  }
};

const saveSettings = async (newSettings: UserSettings) => {
  try {
    settings.value = { ...newSettings };
    await storageService.saveSettings(settings.value);
    theme.value = settings.value.theme;

    if (settings.value.aiApiKey) {
      aiService.setApiKey(settings.value.aiApiKey);
    }

    toast({
      title: "设置保存成功",
      description: "您的设置已保存",
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    toast({
      title: "保存失败",
      description: "保存设置失败，请重试",
      variant: "destructive",
    });
  }
};


// 生命周期
onMounted(async () => {
  console.log('NewTab组件挂载，开始初始化...');

  // 首先设置Chrome书签API监听器
  bookmarkService.setupBookmarkListeners();

  await loadSettings();
  await loadBookmarks();

  // 设置书签变化监听器（优化：保留现有图标，只更新数据结构）
  bookmarkService.addListener(async () => {
    console.log('书签发生变化，重新加载...');

    // 保存当前的图标状态
    const currentIcons = new Map(
      bookmarks.value.map(bookmark => [bookmark.id, bookmark.icon])
    );

    try {
      // 只重新加载数据结构
      await loadBookmarksWithoutIcons();

      // 恢复已加载的图标，并为新书签加载图标
      const newBookmarks = bookmarks.value.filter(bookmark => !currentIcons.has(bookmark.id));

      const defaultIcon = getDefaultIcon();
      bookmarks.value.forEach(bookmark => {
        const savedIcon = currentIcons.get(bookmark.id);
        if (savedIcon && savedIcon !== defaultIcon) {
          bookmark.icon = savedIcon;
        }
      });

      // 只为新书签加载图标
      if (newBookmarks.length > 0) {
        console.log(`检测到 ${newBookmarks.length} 个新书签，加载图标...`);
        await loadBookmarkIcons(newBookmarks);
      }
    } catch (error) {
      console.error('书签变化处理失败:', error);
      // 降级到完整重新加载
      await loadBookmarks();
    }
  });

  console.log('NewTab组件初始化完成');
});
</script>