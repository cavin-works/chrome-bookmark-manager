<template>
  <n-config-provider :theme="currentTheme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <div class="newtab-container">
              <!-- 头部 -->
              <n-layout-header class="header" bordered>
                <n-space justify="space-between" align="center" class="header-content">
                  <h1 class="title">Humi Bookmark Manager</h1>
                  <n-space>
                    <n-button
                      circle
                      quaternary
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
                    <n-button circle quaternary @click="showSettings = true" title="设置">
                      <template #icon>
                        <n-icon>
                          <SettingsOutline />
                        </n-icon>
                      </template>
                    </n-button>
                  </n-space>
                </n-space>
              </n-layout-header>

              <!-- 主内容 -->
              <n-layout has-sider class="main-layout">
                <!-- 侧边栏 -->
                <n-layout-sider
                  bordered
                  collapse-mode="width"
                  :collapsed-width="64"
                  :width="320"
                  :collapsed="sidebarCollapsed"
                  show-trigger
                  @collapse="sidebarCollapsed = true"
                  @expand="sidebarCollapsed = false"
                  class="sidebar"
                  :native-scrollbar="false"
                >
                  <div class="sidebar-content">
                                        <!-- 全部书签 -->
                    <div v-if="!sidebarCollapsed" class="all-bookmarks-section">
                      <div class="all-bookmarks-header">
                        <div
                          class="all-bookmarks-item"
                          :class="{ selected: selectedFolder === '' }"
                          @click="selectFolder('')"
                        >
                          <div class="all-bookmarks-content">
                            <n-icon class="all-bookmarks-icon">
                              <BookmarksOutline />
                            </n-icon>
                            <span class="all-bookmarks-label">全部书签</span>
                            <n-text depth="3" class="all-bookmarks-count">{{ bookmarks.length }}</n-text>
                          </div>
                        </div>

                        <n-button
                          size="small"
                          circle
                          quaternary
                          @click="showAddFolder = true"
                          title="添加文件夹"
                          class="add-folder-btn"
                        >
                          <template #icon>
                            <n-icon>
                              <AddOutline />
                            </n-icon>
                          </template>
                        </n-button>
                      </div>
                    </div>

                    <div v-if="!sidebarCollapsed" class="sidebar-tree">
                      <DragSortableTree
                        :bookmarks="bookmarks"
                        :bookmark-folders="bookmarkFolders"
                        :selected-folder="selectedFolder"
                        @select="selectFolder"
                        @reorder="handleFolderReorder"
                        :hide-all-bookmarks="true"
                      />
                    </div>
                  </div>
                </n-layout-sider>

                <!-- 内容区域 -->
                <n-layout-content class="content">
                  <n-scrollbar class="content-scrollbar">
                    <div class="content-wrapper">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                      <div class="search-section">
                        <n-input
                          v-model:value="searchQuery"
                          placeholder="搜索标题、网址、描述、标签..."
                          clearable
                          size="large"
                          class="search-input"
                          @input="onSearchInput"
                        >
                          <template #prefix>
                            <n-icon size="20" class="search-icon">
                              <SearchOutline />
                            </n-icon>
                          </template>
                        </n-input>
                      </div>

                      <div class="controls-section">
                        <n-button-group size="large">
                          <n-button
                            :type="layout === 'grid' ? 'primary' : 'default'"
                            @click="layout = 'grid'"
                            title="网格视图"
                          >
                            <template #icon>
                              <n-icon size="18">
                                <GridOutline />
                              </n-icon>
                            </template>
                          </n-button>
                          <n-button
                            :type="layout === 'list' ? 'primary' : 'default'"
                            @click="layout = 'list'"
                            title="列表视图"
                          >
                            <template #icon>
                              <n-icon size="18">
                                <ListOutline />
                              </n-icon>
                            </template>
                          </n-button>
                        </n-button-group>
                      </div>
                    </div>

                    <!-- 搜索结果提示 -->
                    <div v-if="searchQuery && filteredBookmarks.length > 0" class="search-result-info">
                      <n-text depth="3">
                        找到 {{ filteredBookmarks.length }} 个匹配的书签
                      </n-text>
                    </div>

                    <!-- 书签内容 -->
                    <div class="bookmarks-container">
                      <!-- 加载状态 -->
                      <n-spin v-if="loading" :show="loading" class="loading-container">
                        <div class="loading-content">
                          <p>加载中...</p>
                        </div>
                      </n-spin>

                      <!-- 空状态 -->
                      <n-empty
                        v-else-if="filteredBookmarks.length === 0"
                        :description="searchQuery ? '没有找到匹配的书签' : '暂无书签'"
                        class="empty-state"
                      >
                        <template #extra>
                          <n-button type="primary" @click="showAddBookmark = true">
                            <template #icon>
                              <n-icon>
                                <AddOutline />
                              </n-icon>
                            </template>
                            添加书签
                          </n-button>
                        </template>
                      </n-empty>

                      <!-- 书签网格/列表 -->
                      <div v-else class="bookmarks-grid" :class="layout">
                        <n-card
                          v-for="bookmark in filteredBookmarks"
                          :key="bookmark.id"
                          class="bookmark-card"
                          hoverable
                          @click="openBookmark(bookmark)"
                        >
                          <template #header>
                            <n-space align="center">
                              <n-image
                                :src="getBookmarkIcon(bookmark)"
                                :fallback-src="'/icon/default.png'"
                                width="32"
                                height="32"
                                class="bookmark-icon"
                                lazy
                                :preview-disabled="true"
                                :show-toolbar="false"
                                :intersection-observer-options="{
                                  root: null,
                                  rootMargin: '50px'
                                }"
                              />
                              <div class="bookmark-title-container">
                                <n-ellipsis class="bookmark-title">{{ bookmark.title }}</n-ellipsis>
                                <n-ellipsis class="bookmark-url">{{ bookmark.url }}</n-ellipsis>
                              </div>
                            </n-space>
                          </template>

                          <template #header-extra>
                            <n-space>
                              <n-button
                                size="small"
                                circle
                                quaternary
                                @click.stop="editBookmark(bookmark)"
                                title="编辑"
                              >
                                <template #icon>
                                  <n-icon>
                                    <CreateOutline />
                                  </n-icon>
                                </template>
                              </n-button>
                              <n-button
                                size="small"
                                circle
                                quaternary
                                @click.stop="deleteBookmark(bookmark)"
                                title="删除"
                              >
                                <template #icon>
                                  <n-icon>
                                    <TrashOutline />
                                  </n-icon>
                                </template>
                              </n-button>
                            </n-space>
                          </template>

                          <div class="bookmark-meta">
                            <n-tag v-if="bookmark.category" type="warning" size="small" class="category-tag">
                              {{ bookmark.category }}
                            </n-tag>
                            <n-space v-if="bookmark.tags && bookmark.tags.length > 0" class="bookmark-tags">
                              <n-tag
                                v-for="tag in bookmark.tags.slice(0, 2)"
                                :key="tag"
                                type="info"
                                size="small"
                              >
                                {{ tag }}
                              </n-tag>
                            </n-space>
                          </div>
                        </n-card>
                      </div>
                    </div>
                  </div>
                  </n-scrollbar>
                </n-layout-content>
              </n-layout>

              <!-- 添加书签对话框 -->
              <n-modal v-model:show="showAddBookmark" preset="dialog" title="添加书签">
                <n-form ref="addBookmarkForm" :model="newBookmark" label-placement="top">
                  <n-form-item label="标题" path="title" required>
                    <n-input v-model:value="newBookmark.title" placeholder="书签标题" />
                  </n-form-item>
                  <n-form-item label="URL" path="url" required>
                    <n-input v-model:value="newBookmark.url" placeholder="https://example.com" />
                  </n-form-item>
                  <n-form-item label="描述" path="description">
                    <n-input
                      v-model:value="newBookmark.description"
                      type="textarea"
                      placeholder="书签描述（可选）"
                    />
                  </n-form-item>
                  <n-form-item label="分类" path="category">
                    <n-select
                      v-model:value="newBookmark.category"
                      :options="categoryOptions"
                      placeholder="自动分类"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item label="文件夹" path="parentId">
                    <n-select
                      v-model:value="newBookmark.parentId"
                      :options="folderOptions"
                      placeholder="默认位置"
                      clearable
                    />
                  </n-form-item>
                </n-form>
                <template #action>
                  <n-space>
                    <n-button @click="showAddBookmark = false">取消</n-button>
                    <n-button
                      type="primary"
                      @click="addBookmark"
                      :disabled="!newBookmark.title || !newBookmark.url"
                    >
                      添加
                    </n-button>
                  </n-space>
                </template>
              </n-modal>

              <!-- 添加文件夹对话框 -->
              <n-modal v-model:show="showAddFolder" preset="dialog" title="创建文件夹">
                <n-form ref="addFolderForm" :model="newFolder" label-placement="top">
                  <n-form-item label="文件夹名称" path="title" required>
                    <n-input v-model:value="newFolder.title" placeholder="文件夹名称" />
                  </n-form-item>
                  <n-form-item label="父文件夹" path="parentId">
                    <n-select
                      v-model:value="newFolder.parentId"
                      :options="folderOptions"
                      placeholder="根目录"
                      clearable
                    />
                  </n-form-item>
                </n-form>
                <template #action>
                  <n-space>
                    <n-button @click="showAddFolder = false">取消</n-button>
                    <n-button
                      type="primary"
                      @click="addFolder"
                      :disabled="!newFolder.title"
                    >
                      创建
                    </n-button>
                  </n-space>
                </template>
              </n-modal>

              <!-- 设置对话框 -->
              <n-modal v-model:show="showSettings" preset="dialog" title="设置">
                <n-form :model="settings" label-placement="left" label-width="100">
                  <n-form-item label="主题">
                    <n-select v-model:value="settings.theme" :options="themeOptions" />
                  </n-form-item>
                  <n-form-item label="布局">
                    <n-select v-model:value="settings.layout" :options="layoutOptions" />
                  </n-form-item>
                  <n-form-item label="显示标签">
                    <n-switch v-model:value="settings.showTags" />
                  </n-form-item>
                  <n-form-item label="显示描述">
                    <n-switch v-model:value="settings.showDescriptions" />
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
                <template #action>
                  <n-space>
                    <n-button @click="showSettings = false">取消</n-button>
                    <n-button type="primary" @click="saveSettings">保存</n-button>
                  </n-space>
                </template>
              </n-modal>
            </div>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { zhCN, dateZhCN } from 'naive-ui';
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutSider,
  NSpace,
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NCard,
  NAvatar,
  NImage,
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
  NText,
  darkTheme,
  lightTheme
} from 'naive-ui';

// 图标导入
import {
  SearchOutline,
  BookmarkOutline,
  BookmarksOutline,
  FolderOutline,
  AddOutline,
  SettingsOutline,
  SunnyOutline,
  MoonOutline,
  GridOutline,
  ListOutline,
  CreateOutline,
  TrashOutline
} from '@vicons/ionicons5';

import { Bookmark, UserSettings } from '../utils/types';
import { bookmarkService } from '../services/bookmarkService';
import { iconService } from '../services/iconService';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { debounce, getSystemTheme } from '../utils/helpers';
import { message, dialog } from '../utils/naive-ui';
import DragSortableTree from '../components/DragSortableTree.vue';

// 响应式数据
const bookmarks = ref<Bookmark[]>([]);
const bookmarkFolders = ref<Bookmark[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedFolder = ref('');
const sidebarCollapsed = ref(false);
const layout = ref<'grid' | 'list'>('grid');
const theme = ref<'light' | 'dark' | 'auto'>('auto');
const showAddBookmark = ref(false);
const showAddFolder = ref(false);
const showSettings = ref(false);
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
  description: '',
  category: '',
  parentId: '',
});

const newFolder = ref({
  title: '',
  parentId: '',
});

// 计算属性
const currentTheme = computed(() => {
  if (theme.value === 'auto') {
    return getSystemTheme() === 'dark' ? darkTheme : lightTheme;
  }
  return theme.value === 'dark' ? darkTheme : lightTheme;
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
  { label: '自动分类', value: '' },
  ...categories.value.map(category => ({ label: category, value: category }))
]);

// 文件夹选项
const folderOptions = computed(() => [
  { label: '默认位置', value: '' },
  ...bookmarkFolders.value
    .filter(folder => folder.title && folder.title.trim() !== '')
    .map(folder => ({ label: folder.title, value: folder.id }))
]);

// 主题选项
const themeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
];

// 布局选项
const layoutOptions = [
  { label: '网格', value: 'grid' },
  { label: '列表', value: 'list' }
];

const filteredBookmarks = computed(() => {
  let filtered = bookmarks.value;

  // 按文件夹过滤
  if (selectedFolder.value) {
    filtered = filtered.filter(bookmark => bookmark.parentId === selectedFolder.value);
  }

  // 按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();

    // 支持多关键词搜索（空格分隔）
    const keywords = query.split(/\s+/).filter(keyword => keyword.length > 0);

    filtered = filtered.filter(bookmark => {
      // 构建搜索文本
      const searchableText = [
        bookmark.title || '',
        bookmark.url || '',
        bookmark.description || '',
        bookmark.category || '',
        ...(bookmark.tags || [])
      ].join(' ').toLowerCase();

      // 检查是否包含所有关键词（AND 搜索）
      return keywords.every(keyword => searchableText.includes(keyword));
    });
  }

  return filtered;
});

// 方法
const getBookmarkIcon = (bookmark: Bookmark) => {
  // 如果有自定义图标，使用自定义图标
  if (bookmark.icon && bookmark.icon !== '/icon/default.png') {
    return bookmark.icon;
  }

  // 如果有URL，尝试生成favicon URL
  if (bookmark.url) {
    try {
      const url = new URL(bookmark.url);
      return `${url.protocol}//${url.hostname}/favicon.ico`;
    } catch (error) {
      console.warn('无效的URL:', bookmark.url);
    }
  }

  // 默认图标
  return '/icon/default.png';
};

const selectFolder = (folderId: string) => {
  selectedFolder.value = folderId;
};

const getFolderCount = (folderId: string) => {
  return bookmarks.value.filter(bookmark => bookmark.parentId === folderId).length;
};

const onSearchInput = debounce(() => {
  // 搜索逻辑已通过计算属性实现
}, 300);

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  settings.value.theme = theme.value;
  saveSettings();
};

const openBookmark = (bookmark: Bookmark) => {
  if (bookmark.url) {
    window.open(bookmark.url, '_blank');
  }
};

const editBookmark = (bookmark: Bookmark) => {
  // TODO: 实现编辑功能
  message.info('编辑功能开发中...');
};

const deleteBookmark = async (bookmark: Bookmark) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除书签"${bookmark.title}"吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await bookmarkService.deleteBookmark(bookmark.id);
        await loadBookmarks();
        message.success('删除成功');
      } catch (error) {
        console.error('删除书签失败:', error);
        message.error('删除失败');
      }
    }
  });
};

const addBookmark = async () => {
  try {
    const bookmarkData = {
      title: newBookmark.value.title,
      url: newBookmark.value.url,
      parentId: newBookmark.value.parentId || undefined,
    };

    const bookmark = await bookmarkService.createBookmark(bookmarkData);

    // AI自动分类
    if (settings.value.autoCategorize && !newBookmark.value.category) {
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

    // 重置表单
    newBookmark.value = {
      title: '',
      url: '',
      description: '',
      category: '',
      parentId: '',
    };

    showAddBookmark.value = false;
    await loadBookmarks();
    message.success('添加成功');
  } catch (error) {
    console.error('添加书签失败:', error);
    message.error('添加失败');
  }
};

const addFolder = async () => {
  try {
    const folder = await bookmarkService.createFolder(
      newFolder.value.title,
      newFolder.value.parentId || undefined
    );

    // 重置表单
    newFolder.value = {
      title: '',
      parentId: '',
    };

    showAddFolder.value = false;
    await loadBookmarks();
    message.success('创建成功');
  } catch (error) {
    console.error('创建文件夹失败:', error);
    message.error('创建失败');
  }
};

// 异步加载书签图标
const loadBookmarkIcons = async (bookmarkList: Bookmark[]) => {
  console.log('开始后台加载图标...');

  // 批量处理图标加载，避免同时发起太多请求
  const batchSize = 5;
  for (let i = 0; i < bookmarkList.length; i += batchSize) {
    const batch = bookmarkList.slice(i, i + batchSize);

    const iconPromises = batch.map(async (bookmark) => {
      if (bookmark.url) {
        try {
          const icon = await iconService.getBookmarkIcon(bookmark.url);
          // 找到对应的书签并更新图标
          const bookmarkIndex = bookmarks.value.findIndex(b => b.id === bookmark.id);
          if (bookmarkIndex !== -1) {
            bookmarks.value[bookmarkIndex].icon = icon;
          }
        } catch (error: any) {
          console.warn('加载图标失败:', bookmark.title, bookmark.url, error?.message || error);
          // 保持默认图标，不做处理
        }
      }
    });

    await Promise.all(iconPromises);

    // 每批之间稍微延迟，避免过度占用资源
    if (i + batchSize < bookmarkList.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('图标加载完成');
};

const loadBookmarks = async () => {
  try {
    loading.value = true;
    console.log('开始加载书签...');

    // 加载书签树
    const bookmarkTree = await bookmarkService.getBookmarkTree();
    console.log('获取到书签树:', bookmarkTree);

    // 提取所有书签
    const allBookmarks = await bookmarkService.getAllBookmarks();
    console.log('获取到书签数量:', allBookmarks.length);

    // 提取文件夹
    const folders = await bookmarkService.getBookmarkFolders();
    console.log('获取到文件夹数量:', folders.length);
    console.log('原始文件夹数据:', folders);

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
    console.log('清理后文件夹数据:', cleanedFolders);

    // 先设置默认图标并立即渲染书签
    allBookmarks.forEach(bookmark => {
      if (bookmark.url && !bookmark.icon) {
        bookmark.icon = '/icon/default.png'; // 设置默认图标
      }
    });

    // 立即设置书签数据，让页面先渲染
    bookmarks.value = allBookmarks;
    bookmarkFolders.value = cleanedFolders;

    // 调试：输出最终的bookmarkFolders.value
    console.log('设置bookmarkFolders.value:', bookmarkFolders.value);

    // 后台异步加载图标
    loadBookmarkIcons(allBookmarks);
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

// 处理文件夹重新排序
const handleFolderReorder = async () => {
  console.log('文件夹已重新排序，重新加载数据...');
  try {
    // 重新加载书签和文件夹数据
    await loadBookmarks();
    message.success('文件夹排序已更新');
  } catch (error) {
    console.error('重新加载数据失败:', error);
    message.error('更新数据失败');
  }
};

const loadSettings = async () => {
  try {
    console.log('开始加载设置...');
    const savedSettings = await storageService.getSettings();
    settings.value = savedSettings;
    theme.value = savedSettings.theme;
    layout.value = savedSettings.layout;

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

const saveSettings = async () => {
  try {
    await storageService.saveSettings(settings.value);
    theme.value = settings.value.theme;
    layout.value = settings.value.layout;

    if (settings.value.aiApiKey) {
      aiService.setApiKey(settings.value.aiApiKey);
    }

    showSettings.value = false;
    message.success('设置保存成功');
  } catch (error) {
    console.error('保存设置失败:', error);
    message.error('保存设置失败');
  }
};

// 监听器
watch(() => settings.value.layout, (newLayout) => {
  layout.value = newLayout;
});

// 生命周期
onMounted(async () => {
  console.log('NewTab组件挂载，开始初始化...');

  // 首先设置Chrome书签API监听器
  bookmarkService.setupBookmarkListeners();

  await loadSettings();
  await loadBookmarks();

  // 设置书签变化监听器
  bookmarkService.addListener(async () => {
    console.log('书签发生变化，重新加载...');
    await loadBookmarks();
  });

  console.log('NewTab组件初始化完成');
});
</script>

<style scoped>
/* 全局容器 */
.newtab-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--n-body-color);
}

/* 头部样式 */
.header {
  height: 64px;
  background: var(--n-card-color);
  border-bottom: 1px solid var(--n-border-color);
  z-index: 100;
}

.header-content {
  padding: 0 24px;
  height: 100%;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--n-text-color);
}

/* 主布局 */
.main-layout {
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  background: var(--n-card-color);
  border-right: 1px solid var(--n-border-color);
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

/* 全部书签区域 */
.all-bookmarks-section {
  padding: 0 12px;
  margin-bottom: 12px;
}

.all-bookmarks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.all-bookmarks-item {
  flex: 1;
  background: transparent;
  color: var(--n-text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 40px;
}

.all-bookmarks-item:hover {
  background: var(--n-color-target);
}

.all-bookmarks-item.selected {
  background: var(--n-primary-color-suppl);
  color: var(--n-primary-color);
}

.all-bookmarks-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 10px;
}

.all-bookmarks-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.all-bookmarks-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.all-bookmarks-count {
  font-size: 12px;
  opacity: 0.7;
}

.add-folder-btn {
  flex-shrink: 0;
}

/* 侧边栏树形结构 */
.sidebar-tree {
  flex: 1;
  overflow: hidden;
  padding: 0 4px;
}

/* 内容区域 */
.content {
  background: var(--n-body-color);
  overflow: hidden;
}

.content-scrollbar {
  height: 100%;
}

.content-wrapper {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: flex-start;
}

.search-section {
  flex: 1;
}

.search-input {
  width: 100%;
}

.search-icon {
  color: var(--n-text-color-3);
}

.controls-section {
  flex-shrink: 0;
}

/* 搜索结果提示 */
.search-result-info {
  margin-bottom: 16px;
  padding: 8px 0;
}

/* 书签容器 */
.bookmarks-container {
  position: relative;
  min-height: 200px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading-content {
  text-align: center;
  color: var(--n-text-color-3);
}

/* 空状态 */
.empty-state {
  min-height: 300px;
}

/* 书签网格/列表 */
.bookmarks-grid {
  display: grid;
  gap: 16px;
}

.bookmarks-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.bookmarks-grid.list {
  grid-template-columns: 1fr;
  gap: 8px;
}

/* 书签卡片 */
.bookmark-card {
  transition: all 0.2s ease;
  cursor: pointer;
}

.bookmark-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 深色模式下的阴影 */
:global([data-theme="dark"]) .bookmark-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.bookmark-icon {
  border-radius: 4px;
  flex-shrink: 0;
}

.bookmark-title-container {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
  line-height: 1.4;
}

.bookmark-url {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
  line-height: 1.3;
}

/* 书签元数据 */
.bookmark-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.category-tag {
  flex-shrink: 0;
}

.bookmark-tags {
  flex: 1;
  min-width: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }

  .search-bar {
    flex-direction: column;
    gap: 12px;
  }

  .bookmarks-grid.grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    padding: 0 16px;
  }

  .title {
    font-size: 18px;
  }
}

/* 列表视图特殊样式 */
.bookmarks-grid.list .bookmark-card {
  padding: 12px 16px;
}

.bookmarks-grid.list .bookmark-card :deep(.n-card__content) {
  padding: 0;
}

.bookmarks-grid.list .bookmark-card :deep(.n-card-header) {
  padding: 0;
}

.bookmarks-grid.list .bookmark-card :deep(.n-card-header__main) {
  flex: 1;
  min-width: 0;
}

/* 对话框样式优化 */
:deep(.n-modal) {
  max-width: 90vw;
}

:deep(.n-dialog) {
  max-width: 500px;
}

/* 表单样式 */
:deep(.n-form-item-label) {
  font-weight: 500;
}

:deep(.n-input) {
  transition: all 0.2s ease;
}

:deep(.n-select) {
  transition: all 0.2s ease;
}

/* 按钮组样式 */
:deep(.n-button-group) {
  border-radius: 8px;
  overflow: hidden;
}

/* 滚动条样式优化 */
:deep(.n-scrollbar-rail) {
  right: 2px;
}

:deep(.n-scrollbar-rail--vertical) {
  width: 6px;
}

:deep(.n-scrollbar-rail__scrollbar) {
  border-radius: 3px;
  background: var(--n-scrollbar-color);
}
</style>

