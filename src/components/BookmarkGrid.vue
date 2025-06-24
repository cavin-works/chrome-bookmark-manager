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
        'px-4 draggable-container',
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
      )"
    >
      <Card
        v-for="(bookmark, index) in filteredBookmarks"
        :key="bookmark.id"
        :class="cn(
          'group cursor-pointer draggable-item hover-lift theme-transition',
          'fade-in',
          layout === 'list' && 'hover:scale-[1.01]'
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
                  :src="getBookmarkIcon(bookmark)"
                  :alt="bookmark.title"
                  class="w-8 h-8 rounded-md"
                  @error="handleImageError"
                />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm font-medium truncate">
                  {{ bookmark.title }}
                </CardTitle>
                <CardDescription class="text-xs truncate mt-1">
                  {{ bookmark.url }}
                </CardDescription>
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
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, BookmarkX } from 'lucide-vue-next';
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

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/icon/default.png';
};

// 拖拽处理
const handleDragStart = (event: DragEvent, bookmark: Bookmark) => {
  if (!event.dataTransfer) return;

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', JSON.stringify(bookmark));
  event.dataTransfer.effectAllowed = 'move';

  // 添加拖拽样式
  const target = event.currentTarget as HTMLElement;
  target.classList.add('dragging');

  // 创建拖拽预览
  setTimeout(() => {
    target.classList.add('drag-ghost');
  }, 0);
};

const handleDragEnd = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('dragging', 'drag-ghost');
};
</script>