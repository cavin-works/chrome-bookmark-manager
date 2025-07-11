<template>
  <div class="flex flex-col space-y-4 p-4 sm:flex-row sm:space-y-0 sm:space-x-4">
    <div class="flex-1">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          @update:model-value="$emit('update:search-query', String($event))"
          placeholder="搜索标题、网址、描述、标签..."
          class="pl-9"
          @input="$emit('search-input')"
        />
      </div>
    </div>

    <div class="flex space-x-1">
      <Button
        :variant="layout === 'grid' ? 'default' : 'outline'"
        size="sm"
        @click="$emit('update:layout', 'grid')"
        title="网格视图"
      >
        <Grid3X3 class="h-4 w-4" />
      </Button>
      <Button
        :variant="layout === 'list' ? 'default' : 'outline'"
        size="sm"
        @click="$emit('update:layout', 'list')"
        title="列表视图"
      >
        <List class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid3X3, List } from 'lucide-vue-next';

interface Props {
  searchQuery: string;
  layout: 'grid' | 'list';
}

defineProps<Props>();

defineEmits<{
  'update:search-query': [value: string];
  'update:layout': [layout: 'grid' | 'list'];
  'search-input': [];
}>();
</script>