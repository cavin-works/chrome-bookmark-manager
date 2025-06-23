<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="320"
    :collapsed="collapsed"
    show-trigger
    @collapse="$emit('collapse', true)"
    @expand="$emit('collapse', false)"
    class="sidebar"
    :native-scrollbar="false"
  >
    <div class="sidebar-content">
      <!-- 全部书签 -->
      <div v-if="!collapsed" class="all-bookmarks-section">
        <div class="all-bookmarks-header">
          <div
            class="all-bookmarks-item"
            :class="{ selected: selectedFolder === '' }"
            @click="$emit('select-folder', '')"
          >
            <div class="all-bookmarks-content">
              <n-icon class="all-bookmarks-icon">
                <BookmarksOutline />
              </n-icon>
              <span class="all-bookmarks-label">全部书签</span>
              <n-text depth="3" class="all-bookmarks-count">{{ totalBookmarks }}</n-text>
            </div>
          </div>

          <n-button
            size="small"
            circle
            quaternary
            @click="$emit('add-folder')"
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

      <div v-if="!collapsed" class="sidebar-tree">
        <DragSortableTree
          :bookmarks="bookmarks"
          :bookmark-folders="bookmarkFolders"
          :selected-folder="selectedFolder"
          @select="$emit('select-folder', $event)"
          @reorder="$emit('reorder')"
          :hide-all-bookmarks="true"
        />
      </div>
    </div>
  </n-layout-sider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NLayoutSider, NIcon, NText, NButton } from 'naive-ui';
import { BookmarksOutline, AddOutline } from '@vicons/ionicons5';
import type { Bookmark } from '../utils/types';
import DragSortableTree from './DragSortableTree.vue';

interface Props {
  bookmarks: Bookmark[];
  bookmarkFolders: Bookmark[];
  selectedFolder: string;
  collapsed: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  'select-folder': [folderId: string];
  'add-folder': [];
  'collapse': [collapsed: boolean];
  'reorder': [];
}>();

const totalBookmarks = computed(() => props.bookmarks.length);
</script>