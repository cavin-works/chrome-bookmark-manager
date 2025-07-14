<template>
  <Card class="p-4 hover:shadow-md transition-shadow">
    <div class="space-y-3">
      <!-- 标签头部 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div
            class="w-4 h-4 rounded-full flex-shrink-0"
            :style="{ backgroundColor: tag.color }"
          />
          <h3 class="font-medium">{{ tag.name }}</h3>
        </div>
        <div class="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            @click="$emit('edit', tag)"
            class="h-8 w-8 p-0"
          >
            <Edit2 class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="$emit('delete', tag)"
            class="h-8 w-8 p-0 text-destructive"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 标签描述 -->
      <p v-if="tag.description" class="text-sm text-muted-foreground">
        {{ tag.description }}
      </p>

      <!-- 使用统计 -->
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-1">
            <Bookmark class="w-4 h-4" />
            <span>{{ tag.usage }} 个书签</span>
          </div>
          <div v-if="tag.lastUsed" class="flex items-center space-x-1">
            <Clock class="w-4 h-4" />
            <span>{{ formatDate(tag.lastUsed) }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-1">
          <Calendar class="w-4 h-4" />
          <span>{{ formatDate(tag.createdAt) }}</span>
        </div>
      </div>

      <!-- 标签状态指示器 -->
      <div class="flex items-center space-x-2">
        <Badge
          :variant="tag.usage === 0 ? 'secondary' : tag.usage >= 10 ? 'default' : 'outline'"
          class="text-xs"
        >
          {{ getTagStatus(tag.usage) }}
        </Badge>
        <div v-if="variant === 'warning'" class="flex items-center space-x-1 text-orange-600">
          <AlertTriangle class="w-3 h-3" />
          <span class="text-xs">未使用</span>
        </div>
      </div>

      <!-- 使用率进度条 -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-300"
          :class="getProgressBarColor(tag.usage)"
          :style="{ width: `${Math.min(tag.usage * 5, 100)}%` }"
        />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Tag } from '@/services/tagStorageService';
import {
  Edit2,
  Bookmark,
  Clock,
  Calendar,
  Trash2,
  AlertTriangle
} from 'lucide-vue-next';

// Props
interface Props {
  tag: Tag;
  variant?: 'default' | 'warning';
}

defineProps<Props>();

// Events
defineEmits<{
  edit: [tag: Tag];
  delete: [tag: Tag];
}>();

// 格式化日期
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)} 周前`;
  } else {
    return `${Math.ceil(diffDays / 30)} 个月前`;
  }
};

// 获取标签状态
const getTagStatus = (usage: number): string => {
  if (usage === 0) return '未使用';
  if (usage >= 10) return '常用';
  return '偶尔使用';
};

// 获取进度条颜色
const getProgressBarColor = (usage: number): string => {
  if (usage === 0) return 'bg-gray-300';
  if (usage >= 10) return 'bg-green-500';
  return 'bg-blue-500';
};
</script>