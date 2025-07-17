<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center space-x-2">
          <Tags class="w-5 h-5 text-primary" />
          <div>
            <p class="text-sm font-medium">总标签数</p>
            <p class="text-2xl font-bold">{{ totalTags }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center space-x-2">
          <BookmarkIcon class="w-5 h-5 text-blue-500" />
          <div>
            <p class="text-sm font-medium">已标记书签</p>
            <p class="text-2xl font-bold">{{ taggedBookmarksCount }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center space-x-2">
          <BookmarkIcon class="w-5 h-5 text-orange-500" />
          <div>
            <p class="text-sm font-medium">未标签书签</p>
            <p class="text-2xl font-bold">{{ untaggedBookmarksCount }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center space-x-2">
          <TrendingUp class="w-5 h-5 text-green-500" />
          <div>
            <p class="text-sm font-medium">常用标签</p>
            <p class="text-2xl font-bold">{{ popularTagsCount }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import {
  Tags,
  Bookmark as BookmarkIcon,
  TrendingUp
} from 'lucide-vue-next';

interface Props {
  totalTags?: number;
  taggedBookmarksCount?: number;
  untaggedBookmarksCount?: number;
  popularTagsCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  totalTags: 0,
  taggedBookmarksCount: 0,
  untaggedBookmarksCount: 0,
  popularTagsCount: 0
});
</script>