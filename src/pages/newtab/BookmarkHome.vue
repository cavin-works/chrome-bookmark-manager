<template>
  <div class="flex flex-col">
    <!-- 搜索栏 -->
    <SearchBar
      v-model:search-query="searchQuery"
      v-model:layout="layout"
      @search-input="onSearchInput"
    />

    <!-- 书签内容 -->
    <div class="flex-1">
      <BookmarkGrid
        :filtered-bookmarks="filteredBookmarks"
        :bookmark-folders="bookmarkFolders"
        :search-query="searchQuery"
        :layout="layout"
        :loading="loading"
        @add-bookmark="$emit('add-bookmark')"
        @open-bookmark="$emit('open-bookmark', $event)"
        @edit-bookmark="$emit('edit-bookmark', $event)"
        @delete-bookmark="$emit('delete-bookmark', $event)"
        @load-more="$emit('load-more')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, withDefaults } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import BookmarkGrid from '@/components/BookmarkGrid.vue';
import type { Bookmark } from '@/utils/types';

interface Props {
  bookmarks?: Bookmark[];
  bookmarkFolders?: Bookmark[];
  selectedFolder?: string | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bookmarks: () => [],
  bookmarkFolders: () => [],
  selectedFolder: null,
  loading: false
});

const emit = defineEmits<{
  'add-bookmark': [];
  'open-bookmark': [bookmark: Bookmark];
  'edit-bookmark': [bookmark: Bookmark];
  'delete-bookmark': [bookmark: Bookmark];
  'load-more': [];
}>();

// 搜索和布局状态
const searchQuery = ref('');
const layout = ref<'grid' | 'list'>('grid');

// 过滤后的书签
const filteredBookmarks = computed(() => {
  let result = props.bookmarks;

  // 按文件夹过滤
  if (props.selectedFolder && props.selectedFolder !== 'all') {
    result = result.filter(bookmark => bookmark.parentId === props.selectedFolder);
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url?.toLowerCase().includes(query) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      bookmark.category?.toLowerCase().includes(query)
    );
  }

  return result;
});

// 搜索输入处理
const onSearchInput = () => {
  // 可以在这里添加搜索分析、历史记录等功能
  console.log('搜索:', searchQuery.value);
};

// 监听选中文件夹变化，清空搜索
watch(() => props.selectedFolder, () => {
  searchQuery.value = '';
});
</script>