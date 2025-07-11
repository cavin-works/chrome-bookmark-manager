<template>
  <div :class="cn('w-80 bg-background text-foreground', isDarkMode && 'dark')">
    <ToastProvider>
      <ScrollArea class="h-96">
        <div class="p-4 space-y-4">
          <!-- 头部 -->
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Humi Bookmarks</h2>
            <Button
              variant="ghost"
              size="sm"
              @click="toggleTheme"
              :title="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
            >
              <Sun v-if="theme === 'dark'" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </Button>
          </div>

          <!-- 当前页面信息 -->
          <Card v-if="currentPage" class="border">
            <CardHeader class="pb-2">
              <div class="flex items-center space-x-2">
                <img
                  :src="currentPage.icon || '/icon/default.png'"
                  @error="(e) => (e.target as HTMLImageElement).src = '/icon/default.png'"
                  class="w-6 h-6 rounded"
                  alt="Page icon"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ currentPage.title }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ currentPage.url }}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent class="pt-0">
              <div class="flex justify-end">
                <Button
                  v-if="!isBookmarked"
                  size="sm"
                  @click="addCurrentPage"
                  :disabled="adding"
                >
                  <Bookmark class="h-4 w-4 mr-1" />
                  收藏
                </Button>
                <Button
                  v-else
                  variant="outline"
                  size="sm"
                  @click="removeCurrentPage"
                  :disabled="removing"
                >
                  <BookmarkCheck class="h-4 w-4 mr-1" />
                  已收藏
                </Button>
              </div>

              <!-- AI分类结果 -->
              <div v-if="aiResult" class="mt-3 space-y-2">
                <Badge variant="secondary">
                  {{ aiResult.category }}
                </Badge>
                <div v-if="aiResult.tags?.length" class="flex flex-wrap gap-1">
                  <Badge
                    v-for="tag in aiResult.tags.slice(0, 3)"
                    :key="tag"
                    variant="outline"
                    class="text-xs"
                  >
                    {{ tag }}
                  </Badge>
                </div>
                <div v-if="aiResult.description" class="text-xs text-muted-foreground">
                  {{ aiResult.description }}
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 搜索框 -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="搜索书签..."
              class="pl-10"
            />
          </div>

          <!-- 最近书签 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">
                {{ searchQuery ? '搜索结果' : '最近书签' }}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                @click="openNewTab"
                title="打开新标签页"
              >
                <Grid3X3 class="h-4 w-4 mr-1" />
                全部
              </Button>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="flex justify-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>

            <!-- 空状态 -->
            <div
              v-else-if="displayBookmarks.length === 0"
              class="text-center py-6 text-muted-foreground"
            >
              <div class="text-sm">
                {{ searchQuery ? '没有找到匹配的书签' : '暂无书签' }}
              </div>
            </div>

            <!-- 书签列表 -->
            <ScrollArea v-else class="h-48">
              <div class="space-y-1">
                <div
                  v-for="bookmark in displayBookmarks"
                  :key="bookmark.id"
                  class="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  @click="openBookmark(bookmark)"
                >
                  <img
                    :src="bookmark.icon || '/icon/default.png'"
                    @error="(e) => (e.target as HTMLImageElement).src = '/icon/default.png'"
                    class="w-4 h-4 rounded flex-shrink-0"
                    alt="Bookmark icon"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ bookmark.title }}</div>
                    <div class="text-xs text-muted-foreground truncate">{{ bookmark.url }}</div>
                    <div v-if="bookmark.category" class="mt-1">
                      <Badge variant="secondary" class="text-xs">
                        {{ bookmark.category }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <!-- 快捷操作 -->
          <div class="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              @click="showAddBookmark = true"
              title="添加书签"
              class="flex-1"
            >
              <Plus class="h-4 w-4 mr-1" />
              添加
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click="showSettings = true"
              title="设置"
              class="flex-1"
            >
              <Settings class="h-4 w-4 mr-1" />
              设置
            </Button>
          </div>

          <!-- 对话框组件 -->
          <AddBookmarkDialog
            v-model:show="showAddBookmark"
            :category-options="categoryOptions"
            :folder-options="folderOptions"
            @confirm="addBookmark"
          />

          <SettingsDialog
            v-model:show="showSettings"
            :settings="settings"
            @confirm="saveSettings"
          />
        </div>
      </ScrollArea>

      <Toaster />
    </ToastProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  Sun,
  Moon,
  Bookmark,
  BookmarkCheck,
  Search,
  Grid3X3,
  Plus,
  Settings
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/components/ui/toast/use-toast';
import { cn } from '@/lib/utils';
import chrome from 'webextension-polyfill';

import { Bookmark as BookmarkType, UserSettings } from '../utils/types';
import { bookmarkService } from '../services/bookmarkService';
import { aiService } from '../services/aiService';
import { iconService } from '../services/iconService';
import { storageService } from '../services/storageService';
import { getSystemTheme } from '../utils/helpers';

// 组件导入
import AddBookmarkDialog from '../components/AddBookmarkDialog.vue';
import SettingsDialog from '../components/SettingsDialog.vue';

// 响应式数据
const bookmarks = ref<BookmarkType[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const currentPage = ref<any>(null);
const theme = ref<'light' | 'dark' | 'auto'>('auto');
const isBookmarked = ref(false);
const adding = ref(false);
const removing = ref(false);
const aiResult = ref<any>(null);
const showAddBookmark = ref(false);
const showSettings = ref(false);
const settings = ref<UserSettings>({
  theme: 'auto',
  layout: 'grid',
  showTags: true,
  showDescriptions: true,
  autoCategorize: true,
});

// Toast
const { toast } = useToast();

// 计算属性
const isDarkMode = computed(() => {
  if (theme.value === 'auto') {
    return getSystemTheme() === 'dark';
  }
  return theme.value === 'dark';
});

// 获取分类选项
const categories = computed(() => {
  const categorySet = new Set<string>();
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

// 文件夹选项（简化版，只支持根目录）
const folderOptions = computed(() => [
  { label: '默认位置', value: 'default' }
]);

// 显示的书签列表
const displayBookmarks = computed(() => {
  let filtered = bookmarks.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    const keywords = query.split(/\s+/).filter(keyword => keyword.length > 0);

    filtered = filtered.filter(bookmark => {
      const searchableText = [
        bookmark.title || '',
        bookmark.url || '',
        bookmark.description || '',
        bookmark.category || '',
        ...(bookmark.tags || [])
      ].join(' ').toLowerCase();

      return keywords.every(keyword => searchableText.includes(keyword));
    });
  }

  // 限制显示数量，按时间排序
  return filtered
    .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
    .slice(0, 10);
});

// 方法
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  settings.value.theme = theme.value;
  saveSettings(settings.value);
};

const openBookmark = (bookmark: BookmarkType) => {
  if (bookmark.url) {
    chrome.tabs.create({ url: bookmark.url });
    window.close();
  }
};

const openNewTab = () => {
  chrome.tabs.create({ url: 'newtab.html' });
  window.close();
};

const getCurrentPage = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith('chrome://')) {
      currentPage.value = {
        title: tab.title,
        url: tab.url,
        icon: tab.favIconUrl || '/icon/default.png'
      };

      // 检查是否已收藏
      const existing = bookmarks.value.find(b => b.url === tab.url);
      isBookmarked.value = !!existing;

      // AI分析页面（如果启用）
      if (settings.value.autoCategorize && !existing) {
        try {
          aiResult.value = await aiService.categorizeBookmark({
            id: 'temp-id',
            title: tab.title || '',
            url: tab.url
          });
        } catch (error) {
          console.error('AI分析失败:', error);
        }
      }
    }
  } catch (error) {
    console.error('获取当前页面失败:', error);
  }
};

const addCurrentPage = async () => {
  if (!currentPage.value) return;

  adding.value = true;
  try {
    const bookmarkData = {
      title: currentPage.value.title,
      url: currentPage.value.url,
    };

    const bookmark = await bookmarkService.createBookmark(bookmarkData);

    // 应用AI结果
    if (aiResult.value) {
      bookmark.category = aiResult.value.category;
      bookmark.tags = aiResult.value.tags;
      bookmark.description = aiResult.value.description;
    }

    await loadBookmarks();
    isBookmarked.value = true;

    toast({
      title: "收藏成功",
      description: "页面已添加到书签",
    });
  } catch (error) {
    console.error('添加书签失败:', error);
    toast({
      title: "收藏失败",
      description: "添加书签失败，请重试",
      variant: "destructive",
    });
  } finally {
    adding.value = false;
  }
};

const removeCurrentPage = async () => {
  if (!currentPage.value) return;

  removing.value = true;
  try {
    const existing = bookmarks.value.find(b => b.url === currentPage.value.url);
    if (existing) {
      await bookmarkService.deleteBookmark(existing.id);
      await loadBookmarks();
      isBookmarked.value = false;

      toast({
        title: "已取消收藏",
        description: "书签已删除",
      });
    }
  } catch (error) {
    console.error('删除书签失败:', error);
    toast({
      title: "删除失败",
      description: "删除书签失败，请重试",
      variant: "destructive",
    });
  } finally {
    removing.value = false;
  }
};

const addBookmark = async (formData: any) => {
  try {
    const bookmarkData = {
      title: formData.title,
      url: formData.url,
      parentId: (formData.parentId && formData.parentId !== 'default') ? formData.parentId : undefined,
    };

    await bookmarkService.createBookmark(bookmarkData);
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

const loadBookmarks = async () => {
  try {
    loading.value = true;
    const allBookmarks = await bookmarkService.getAllBookmarks();

    // 设置默认图标
    allBookmarks.forEach(bookmark => {
      if (bookmark.url && !bookmark.icon) {
        bookmark.icon = '/icon/default.png';
      }
    });

    bookmarks.value = allBookmarks;
  } catch (error) {
    console.error('加载书签失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadSettings = async () => {
  try {
    const savedSettings = await storageService.getSettings();
    settings.value = savedSettings;
    theme.value = savedSettings.theme;

    if (savedSettings.aiApiKey) {
      aiService.setApiKey(savedSettings.aiApiKey);
    }
  } catch (error) {
    console.error('加载设置失败:', error);
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
  await loadSettings();
  await loadBookmarks();
  await getCurrentPage();
});
</script>
