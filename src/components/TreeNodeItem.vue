<template>
  <div class="w-full">
    <div
      :class="cn(
        'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        selectedFolder === folder.id && 'bg-accent text-accent-foreground font-medium'
      )"
      :style="{ paddingLeft: (level * 16 + 8) + 'px' }"
      @click="$emit('select', folder.id)"
    >
      <Folder class="h-4 w-4 text-muted-foreground" />
      <span class="flex-1 truncate text-sm">{{ folder.title }}</span>
      <Badge v-if="folder.count > 0" variant="secondary" class="h-5 text-xs">
        {{ folder.count }}
      </Badge>
    </div>

    <!-- 子文件夹 -->
    <VueDraggable
      v-if="folder.children && folder.children.length > 0"
      v-model="folder.children"
      group="bookmark-folders"
      :animation="200"
      ghost-class="opacity-50"
      chosen-class="bg-accent/50"
      drag-class="rotate-2 scale-105"
      tag="div"
    >
      <TreeNodeItem
        v-for="childFolder in folder.children"
        :key="childFolder.id"
        :folder="childFolder"
        :selected-folder="selectedFolder"
        :level="level + 1"
        @select="$emit('select', $event)"
      />
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';

interface TreeNodeData {
  id: string;
  title: string;
  count: number;
  parentId?: string;
  index?: number;
  level: number;
  children: TreeNodeData[];
}

interface Props {
  folder: TreeNodeData;
  selectedFolder: string;
  level: number;
}

defineProps<Props>();

defineEmits<{
  select: [folderId: string];
}>();
</script>

