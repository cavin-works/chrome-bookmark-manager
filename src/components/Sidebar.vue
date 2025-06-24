<template>
  <aside
    :class="cn(
      'relative flex flex-col border-r border-border bg-background theme-transition drop-zone',
      collapsed ? 'w-16' : 'w-80'
    )"
    @drop="handleDrop"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
  >
    <!-- 折叠/展开按钮 -->
    <div class="absolute -right-3 top-6 z-10">
      <Button
        variant="outline"
        size="sm"
        @click="$emit('collapse', !collapsed)"
        class="h-6 w-6 rounded-full p-0"
      >
        <ChevronLeft v-if="!collapsed" class="h-3 w-3" />
        <ChevronRight v-else class="h-3 w-3" />
      </Button>
    </div>

    <div class="flex-1 overflow-hidden">
      <ScrollArea class="h-full">
        <div class="p-2">
          <!-- 全部书签 -->
          <div v-if="!collapsed" class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                :class="cn(
                  'h-auto w-full justify-start p-2',
                  selectedFolder === '' && 'bg-accent text-accent-foreground'
                )"
                @click="$emit('select-folder', '')"
              >
                <BookmarkIcon class="mr-2 h-4 w-4" />
                <span class="flex-1 text-left">全部书签</span>
                <Badge variant="secondary" class="ml-auto">{{ totalBookmarks }}</Badge>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                @click="$emit('add-folder')"
                title="添加文件夹"
                class="ml-1 h-8 w-8 p-0"
              >
                <Plus class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- 文件夹树 -->
          <div v-if="!collapsed">
            <DragSortableTree
              :bookmarks="bookmarks"
              :bookmark-folders="bookmarkFolders"
              :selected-folder="selectedFolder"
              @select="$emit('select-folder', $event)"
              @reorder="$emit('reorder')"
              :hide-all-bookmarks="true"
            />
          </div>

          <!-- 折叠状态的简化图标 -->
          <div v-else class="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('select-folder', '')"
              class="h-10 w-10 p-0"
              :class="selectedFolder === '' && 'bg-accent'"
            >
              <BookmarkIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('add-folder')"
              title="添加文件夹"
              class="h-10 w-10 p-0"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bookmark as BookmarkIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { Bookmark as BookmarkType } from '../utils/types';
import DragSortableTree from './DragSortableTree.vue';

interface Props {
  bookmarks: BookmarkType[];
  bookmarkFolders: BookmarkType[];
  selectedFolder: string;
  collapsed: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'select-folder': [folderId: string];
  'add-folder': [];
  'collapse': [collapsed: boolean];
  'reorder': [];
}>();

const totalBookmarks = computed(() => props.bookmarks.length);

// 拖拽状态
const isDragOver = ref(false);

// 拖拽处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
  const target = event.currentTarget as HTMLElement;
  target.classList.add('drag-over');
};

const handleDragLeave = (event: DragEvent) => {
  isDragOver.value = false;
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');

  // 处理拖拽数据
  try {
    const bookmarkData = event.dataTransfer?.getData('text/plain');
    if (bookmarkData) {
      const bookmark = JSON.parse(bookmarkData) as BookmarkType;
      // 这里可以添加将书签移动到侧边栏的逻辑
      console.log('拖拽书签到侧边栏:', bookmark);
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error);
  }
};
</script>