<template>
  <div class="w-full space-y-4">
    <!-- 搜索结果提示 -->
    <div v-if="searchQuery && filteredBookmarks.length > 0" class="px-4">
      <p class="text-sm text-muted-foreground">
        找到 {{ filteredBookmarks.length }} 个匹配的书签
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="ml-2 text-muted-foreground">加载中...</p>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="filteredBookmarks.length === 0"
      class="flex flex-col items-center justify-center py-8 space-y-4"
    >
      <div class="text-center space-y-2">
        <BookmarkX class="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 class="text-lg font-medium">{{ searchQuery ? '没有找到匹配的书签' : '暂无书签' }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ searchQuery ? '尝试使用不同的关键词搜索' : '开始添加您的第一个书签' }}
        </p>
      </div>
      <Button @click="$emit('add-bookmark')">
        <Plus class="mr-2 h-4 w-4" />
        添加书签
      </Button>
    </div>

    <!-- 书签网格/列表 -->
    <div
      v-else
      :class="cn(
        'px-4 pb-8 draggable-container',
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
      )"
    >
      <Card
        v-for="(bookmark, index) in displayedBookmarks"
        :key="bookmark.id"
        :class="cn(
          'group cursor-pointer draggable-item theme-transition',
          layout === 'grid' ? 'hover-lift' : 'hover-glow',
          'fade-in'
        )"
        :style="{ animationDelay: `${index * 50}ms` }"
        @click="$emit('open-bookmark', bookmark)"
        draggable="true"
        @dragstart="handleDragStart($event, bookmark)"
        @dragend="handleDragEnd"
      >
        <CardHeader :class="layout === 'list' ? 'pb-2' : 'pb-3'">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <div class="flex-shrink-0">
                <img
                  :src="bookmark.icon || getDefaultIcon()"
                  :alt="bookmark.title"
                  class="w-8 h-8 rounded-md object-cover"
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm font-medium truncate">
                  {{ bookmark.title }}
                </CardTitle>
                <CardDescription class="text-xs truncate mt-1">
                  {{ bookmark.url }}
                </CardDescription>
                <div v-if="getBookmarkPath(bookmark.parentId)" class="flex items-center text-xs text-muted-foreground/70 truncate mt-1">
                  <FolderIcon class="w-3 h-3 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ getBookmarkPath(bookmark.parentId) }}</span>
                </div>
              </div>
            </div>

            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                @click.stop="$emit('edit-bookmark', bookmark)"
                title="编辑"
                class="h-8 w-8 p-0"
              >
                <Edit class="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click.stop="$emit('delete-bookmark', bookmark)"
                title="删除"
                class="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent v-if="bookmark.category || (bookmark.tags && bookmark.tags.length > 0)" class="pt-0">
          <div class="flex flex-wrap gap-1">
            <Badge v-if="bookmark.category" variant="secondary" class="text-xs">
              {{ bookmark.category }}
            </Badge>
            <Badge
              v-for="tag in bookmark.tags?.slice(0, 2)"
              :key="tag"
              variant="outline"
              class="text-xs"
            >
              {{ tag }}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="hasMoreToLoad" class="flex items-center justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <p class="ml-2 text-sm text-muted-foreground">加载更多...</p>
    </div>

    <!-- 滚动触发器 - 用于检测是否需要加载更多 -->
    <div
      ref="loadTrigger"
      v-if="hasMoreToLoad"
      class="h-1"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, BookmarkX, Folder as FolderIcon } from 'lucide-vue-next';
import type { Bookmark } from '../utils/types';
import { getDefaultIcon as getDefaultIconUtil } from '../utils/defaultIcon';

interface Props {
  filteredBookmarks: Bookmark[];
  bookmarkFolders: Bookmark[];
  searchQuery: string;
  layout: 'grid' | 'list';
  loading: boolean;
  itemsPerPage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 50, // 默认每页加载 50 个
});

const emit = defineEmits<{
  'add-bookmark': [];
  'open-bookmark': [bookmark: Bookmark];
  'edit-bookmark': [bookmark: Bookmark];
  'delete-bookmark': [bookmark: Bookmark];
  'load-more': [];
}>();

// 分页状态
const page = ref(1);

// 计算当前显示的书签
const displayedBookmarks = computed(() => {
  return props.filteredBookmarks.slice(0, page.value * props.itemsPerPage);
});

// 计算是否还有更多内容需要加载
const hasMoreToLoad = computed(() => {
  return displayedBookmarks.value.length < props.filteredBookmarks.length;
});

// 监听 filteredBookmarks 的变化，重置分页
watch(() => props.filteredBookmarks, () => {
  page.value = 1;
});

// 加载更多数据
const loadMore = () => {
  if (hasMoreToLoad.value) {
    page.value++;
    emit('load-more');
  }
};

// Intersection Observer 用于检测滚动触发器
const loadTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const setupIntersectionObserver = () => {
  if (!loadTrigger.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreToLoad.value) {
        console.log('触发加载更多...');
        loadMore();
      }
    },
    {
      root: null, // 使用视口作为根
      rootMargin: '200px', // 提前200px触发
      threshold: 0.1
    }
  );

  observer.observe(loadTrigger.value);
};

const cleanupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

// 监听loadTrigger的变化，重新设置观察器
watch(loadTrigger, (newTrigger) => {
  cleanupIntersectionObserver();
  if (newTrigger) {
    // 使用nextTick确保DOM已更新
    setTimeout(() => {
      setupIntersectionObserver();
    }, 0);
  }
});

onMounted(() => {
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanupIntersectionObserver();
});

// 获取默认图标URL
const getDefaultIcon = (): string => {
  return getDefaultIconUtil();
};

// 处理图片加载成功
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // 检查加载的图片是否是有效的（非空白、非错误图片）
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    handleImageError(event);
  }
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // 避免无限循环，如果已经是默认图标则不再处理
  if (img.src !== getDefaultIcon()) {
    img.src = getDefaultIcon();
  }
};

// 拖拽处理
const handleDragStart = (event: DragEvent, bookmark: Bookmark) => {
  if (!event.dataTransfer) return;

  // 设置拖拽数据
  event.dataTransfer.setData('application/x-bookmark', JSON.stringify(bookmark));
  event.dataTransfer.setData('text/plain', bookmark.url || bookmark.title);
  event.dataTransfer.effectAllowed = 'move';

  const target = event.currentTarget as HTMLElement;
  target.classList.add('dragging');

  setTimeout(() => {
    target.classList.add('drag-ghost');
  }, 0);
};

const handleDragEnd = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('dragging', 'drag-ghost');
};

// 获取书签的文件夹路径
const getBookmarkPath = (parentId?: string): string => {
  if (!parentId || !props.bookmarkFolders.length) return '';

  const buildPath = (folderId: string): string[] => {
    const folder = props.bookmarkFolders.find(f => f.id === folderId);
    if (!folder || !folder.title) return [];

    // 如果是根文件夹，返回空路径
    if (folder.parentId === '0' || folder.parentId === '1' || folder.parentId === '2') {
      return [folder.title];
    }

    // 递归构建路径
    const parentPath = folder.parentId ? buildPath(folder.parentId) : [];
    return [...parentPath, folder.title];
  };

  const pathArray = buildPath(parentId);
  return pathArray.join(' / ');
};
</script>