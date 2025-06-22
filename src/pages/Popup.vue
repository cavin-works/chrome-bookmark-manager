<template>
  <n-config-provider :theme="currentTheme">
    <n-message-provider>
      <n-scrollbar class="popup-scrollbar">
        <div class="popup-container">
        <!-- 头部 -->
        <n-space justify="space-between" align="center" class="popup-header">
          <h2 class="popup-title">Humi Bookmarks</h2>
          <n-button
            circle
            quaternary
            size="small"
            @click="toggleTheme"
            :title="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          >
            <template #icon>
              <n-icon>
                <SunnyOutline v-if="theme === 'dark'" />
                <MoonOutline v-else />
              </n-icon>
            </template>
          </n-button>
        </n-space>

        <!-- 当前页面信息 -->
        <n-card v-if="currentPage" class="current-page-card" size="small">
          <template #header>
            <n-space align="center">
              <n-avatar
                :size="24"
                :src="currentPage.icon || '/icon/default.png'"
                fallback-src="/icon/default.png"
              />
              <div class="page-info">
                <n-ellipsis class="page-title">{{ currentPage.title }}</n-ellipsis>
                <n-ellipsis class="page-url">{{ currentPage.url }}</n-ellipsis>
              </div>
            </n-space>
          </template>

          <template #header-extra>
            <n-button
              v-if="!isBookmarked"
              type="primary"
              size="small"
              @click="addCurrentPage"
              :loading="adding"
            >
              <template #icon>
                <n-icon>
                  <BookmarkOutline />
                </n-icon>
              </template>
              收藏
            </n-button>
            <n-button
              v-else
              type="warning"
              size="small"
              @click="removeCurrentPage"
              :loading="removing"
            >
              <template #icon>
                <n-icon>
                  <BookmarksOutline />
                </n-icon>
              </template>
              已收藏
            </n-button>
          </template>

          <!-- AI分类结果 -->
          <div v-if="aiResult" class="ai-result">
            <n-space vertical size="small">
              <n-space>
                <n-tag type="warning" size="small">
                  {{ aiResult.category }}
                </n-tag>
              </n-space>
              <n-space>
                <n-tag
                  v-for="tag in aiResult.tags?.slice(0, 3)"
                  :key="tag"
                  type="info"
                  size="small"
                >
                  {{ tag }}
                </n-tag>
              </n-space>
              <div v-if="aiResult.description" class="ai-description">
                {{ aiResult.description }}
              </div>
            </n-space>
          </div>
        </n-card>

        <!-- 搜索框 -->
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索书签..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon>
              <SearchOutline />
            </n-icon>
          </template>
        </n-input>

        <!-- 最近书签 -->
        <div class="bookmarks-section">
          <n-space justify="space-between" align="center" class="section-header">
            <h3>{{ searchQuery ? '搜索结果' : '最近书签' }}</h3>
            <n-button
              text
              size="small"
              @click="openNewTab"
              title="打开新标签页"
            >
              <template #icon>
                <n-icon>
                  <GridOutline />
                </n-icon>
              </template>
              全部
            </n-button>
          </n-space>

          <!-- 加载状态 -->
          <n-spin v-if="loading" :show="loading" size="small">
            <div style="height: 100px;"></div>
          </n-spin>

          <!-- 空状态 -->
          <n-empty
            v-else-if="displayBookmarks.length === 0"
            size="small"
            :description="searchQuery ? '没有找到匹配的书签' : '暂无书签'"
          />

          <!-- 书签列表 -->
          <n-scrollbar v-else class="bookmarks-list-scrollbar">
            <div class="bookmarks-list">
              <div
                v-for="bookmark in displayBookmarks"
                :key="bookmark.id"
                class="bookmark-item"
                @click="openBookmark(bookmark)"
              >
              <n-space align="center">
                <n-avatar
                  :size="20"
                  :src="bookmark.icon || '/icon/default.png'"
                  fallback-src="/icon/default.png"
                />
                <div class="bookmark-content">
                  <div class="bookmark-title">{{ bookmark.title }}</div>
                  <div class="bookmark-url">{{ bookmark.url }}</div>
                  <div v-if="bookmark.category" class="bookmark-category">
                    <n-tag type="warning" size="tiny">{{ bookmark.category }}</n-tag>
                  </div>
                </div>
              </n-space>
            </div>
            </div>
          </n-scrollbar>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <n-space>
            <n-button
              size="small"
              @click="showAddBookmark = true"
              title="添加书签"
            >
              <template #icon>
                <n-icon>
                  <AddOutline />
                </n-icon>
              </template>
              添加
            </n-button>
            <n-button
              size="small"
              @click="showSettings = true"
              title="设置"
            >
              <template #icon>
                <n-icon>
                  <SettingsOutline />
                </n-icon>
              </template>
              设置
            </n-button>
          </n-space>
        </div>

        <!-- 添加书签对话框 -->
        <n-modal v-model:show="showAddBookmark">
          <n-card style="width: 400px" title="添加书签">
            <n-form :model="newBookmark">
              <n-form-item label="标题" required>
                <n-input v-model:value="newBookmark.title" />
              </n-form-item>
              <n-form-item label="URL" required>
                <n-input v-model:value="newBookmark.url" />
              </n-form-item>
              <n-form-item label="文件夹">
                <n-select
                  v-model:value="newBookmark.parentId"
                  :options="folderOptions"
                  clearable
                />
              </n-form-item>
            </n-form>
            <template #footer>
              <n-space justify="end">
                <n-button @click="showAddBookmark = false">取消</n-button>
                <n-button type="primary" @click="addBookmark">添加</n-button>
              </n-space>
            </template>
          </n-card>
        </n-modal>

        <!-- 设置对话框 -->
        <n-modal v-model:show="showSettings">
          <n-card style="width: 400px" title="设置">
            <n-form :model="settings">
              <n-form-item label="主题">
                <n-select v-model:value="settings.theme" :options="themeOptions" />
              </n-form-item>
              <n-form-item label="自动分类">
                <n-switch v-model:value="settings.autoCategorize" />
              </n-form-item>
              <n-form-item label="OpenAI API密钥">
                <n-input
                  v-model:value="settings.aiApiKey"
                  type="password"
                  placeholder="sk-..."
                  show-password-on="click"
                />
              </n-form-item>
            </n-form>
            <template #footer>
              <n-space justify="end">
                <n-button @click="showSettings = false">取消</n-button>
                <n-button type="primary" @click="saveSettings">保存</n-button>
              </n-space>
            </template>
          </n-card>
        </n-modal>
      </div>
      </n-scrollbar>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NSpace,
  NButton,
  NIcon,
  NInput,
  NCard,
  NAvatar,
  NEllipsis,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NSpin,
  NEmpty,
  NScrollbar,
  darkTheme,
  lightTheme
} from 'naive-ui';

import {
  SearchOutline,
  BookmarkOutline,
  BookmarksOutline,
  AddOutline,
  SettingsOutline,
  SunnyOutline,
  MoonOutline,
  GridOutline
} from '@vicons/ionicons5';

import { Bookmark, UserSettings, AIResult } from '../utils/types';
import { bookmarkService } from '../services/bookmarkService';
import { iconService } from '../services/iconService';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { getSystemTheme } from '../utils/helpers';
import { message } from '../utils/naive-ui';

// 响应式数据
const bookmarks = ref<Bookmark[]>([]);
const bookmarkFolders = ref<Bookmark[]>([]);
const loading = ref(true);
const adding = ref(false);
const removing = ref(false);
const searchQuery = ref('');
const theme = ref<'light' | 'dark' | 'auto'>('auto');
const showAddBookmark = ref(false);
const showSettings = ref(false);
const currentPage = ref<{
  title: string;
  url: string;
  icon?: string;
} | null>(null);
const aiResult = ref<AIResult | null>(null);

const settings = ref<UserSettings>({
  theme: 'auto',
  layout: 'grid',
  showTags: true,
  showDescriptions: true,
  autoCategorize: true,
});

const newBookmark = ref({
  title: '',
  url: '',
  parentId: '',
});

// 计算属性
const currentTheme = computed(() => {
  if (theme.value === 'auto') {
    return getSystemTheme() === 'dark' ? darkTheme : lightTheme;
  }
  return theme.value === 'dark' ? darkTheme : lightTheme;
});

const isBookmarked = computed(() => {
  if (!currentPage.value) return false;
  return bookmarks.value.some(bookmark => bookmark.url === currentPage.value?.url);
});

const folderOptions = computed(() => [
  { label: '默认位置', value: '' },
  ...bookmarkFolders.value
    .filter(folder => folder.title && folder.title.trim() !== '')
    .map(folder => ({ label: folder.title, value: folder.id }))
]);

const themeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
];

const displayBookmarks = computed(() => {
  let filtered = bookmarks.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(bookmark =>
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url?.toLowerCase().includes(query) ||
      bookmark.category?.toLowerCase().includes(query)
    );
  } else {
    // 显示最近的10个书签
    filtered = filtered
      .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
      .slice(0, 10);
  }

  return filtered;
});

// 方法
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  settings.value.theme = theme.value;
  saveSettings();
};

const openBookmark = (bookmark: Bookmark) => {
  if (bookmark.url) {
    chrome.tabs.create({ url: bookmark.url });
    window.close();
  }
};

const openNewTab = () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
  window.close();
};

const addCurrentPage = async () => {
  if (!currentPage.value) return;

  try {
    adding.value = true;

    const bookmark = await bookmarkService.createBookmark({
      title: currentPage.value.title,
      url: currentPage.value.url,
    });

    // AI自动分类
    if (settings.value.autoCategorize && settings.value.aiApiKey) {
      try {
        const result = await aiService.categorizeBookmark(bookmark);
        aiResult.value = result;

        // 更新书签信息
        await bookmarkService.updateBookmark(bookmark.id, {
          title: bookmark.title,
          url: bookmark.url,
        });
      } catch (error) {
        console.error('AI分类失败:', error);
      }
    }

    await loadBookmarks();
    message.success('收藏成功');
  } catch (error) {
    console.error('添加书签失败:', error);
    message.error('收藏失败');
  } finally {
    adding.value = false;
  }
};

const removeCurrentPage = async () => {
  if (!currentPage.value) return;

  try {
    removing.value = true;

    const bookmark = bookmarks.value.find(b => b.url === currentPage.value?.url);
    if (bookmark) {
      await bookmarkService.deleteBookmark(bookmark.id);
      await loadBookmarks();
      aiResult.value = null;
      message.success('取消收藏成功');
    }
  } catch (error) {
    console.error('删除书签失败:', error);
    message.error('取消收藏失败');
  } finally {
    removing.value = false;
  }
};

const addBookmark = async () => {
  try {
    await bookmarkService.createBookmark({
      title: newBookmark.value.title,
      url: newBookmark.value.url,
      parentId: newBookmark.value.parentId || undefined,
    });

    newBookmark.value = { title: '', url: '', parentId: '' };
    showAddBookmark.value = false;
    await loadBookmarks();
    message.success('添加成功');
  } catch (error) {
    message.error('添加失败');
  }
};

const loadCurrentPage = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.title && tab.url) {
      currentPage.value = {
        title: tab.title,
        url: tab.url,
      };

      // 获取页面图标
      try {
        const icon = await iconService.getBookmarkIcon(tab.url);
        if (currentPage.value) {
          currentPage.value.icon = icon;
        }
      } catch (error) {
        console.warn('获取页面图标失败:', error);
      }
    }
  } catch (error) {
    console.error('获取当前页面信息失败:', error);
  }
};

const loadBookmarks = async () => {
  try {
    loading.value = true;

    const allBookmarks = await bookmarkService.getAllBookmarks();
    const folders = await bookmarkService.getBookmarkFolders();

    // 加载图标
    const iconPromises = allBookmarks.map(async (bookmark) => {
      if (bookmark.url) {
        try {
          bookmark.icon = await iconService.getBookmarkIcon(bookmark.url);
        } catch (error) {
          bookmark.icon = '/icon/default.png';
        }
      }
    });
    await Promise.all(iconPromises);

    bookmarks.value = allBookmarks;
    bookmarkFolders.value = folders.filter(f => f.title && f.title.trim() !== '');
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

const saveSettings = async () => {
  try {
    await storageService.saveSettings(settings.value);
    theme.value = settings.value.theme;

    if (settings.value.aiApiKey) {
      aiService.setApiKey(settings.value.aiApiKey);
    }

    showSettings.value = false;
    message.success('设置保存成功');
  } catch (error) {
    message.error('保存设置失败');
  }
};

// 生命周期
onMounted(async () => {
  await loadSettings();
  await loadCurrentPage();
  await loadBookmarks();
});
</script>

<style scoped>
.popup-scrollbar {
  max-height: 600px;
}

.popup-container {
  width: 400px;
  padding: 16px;
}

.popup-header {
  margin-bottom: 16px;
}

.popup-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.current-page-card {
  margin-bottom: 16px;
}

.page-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.page-url {
  font-size: 0.75rem;
  opacity: 0.7;
}

.ai-result {
  margin-top: 12px;
}

.ai-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.search-input {
  margin-bottom: 16px;
}

.bookmarks-section {
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.bookmarks-list-scrollbar {
  max-height: 300px;
}

.bookmarks-list {
  padding-right: 8px;
}

.bookmark-item {
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bookmark-item:hover {
  background-color: var(--hover-color);
}

.bookmark-content {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-url {
  font-size: 0.75rem;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.bookmark-category {
  margin-top: 4px;
}

.quick-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}
</style>
