<template>
  <div class="bookmarks-container">
    <!-- 搜索结果提示 -->
    <div v-if="searchQuery && filteredBookmarks.length > 0" class="search-result-info">
      <n-text depth="3">
        找到 {{ filteredBookmarks.length }} 个匹配的书签
      </n-text>
    </div>

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
        <n-button type="primary" @click="$emit('add-bookmark')">
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
        @click="$emit('open-bookmark', bookmark)"
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
              @click.stop="$emit('edit-bookmark', bookmark)"
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
              @click.stop="$emit('delete-bookmark', bookmark)"
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
</template>

<script setup lang="ts">
import {
  NSpin,
  NEmpty,
  NCard,
  NSpace,
  NImage,
  NEllipsis,
  NButton,
  NIcon,
  NTag,
  NText
} from 'naive-ui';
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5';
import type { Bookmark } from '../utils/types';

interface Props {
  filteredBookmarks: Bookmark[];
  searchQuery: string;
  layout: 'grid' | 'list';
  loading: boolean;
}

defineProps<Props>();

defineEmits<{
  'add-bookmark': [];
  'open-bookmark': [bookmark: Bookmark];
  'edit-bookmark': [bookmark: Bookmark];
  'delete-bookmark': [bookmark: Bookmark];
}>();

// 获取书签图标
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
</script>