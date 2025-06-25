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

    <!-- 子文件夹 - 支持所有文件夹都有拖拽区域 -->
    <VueDraggable
      v-model="childrenModel"
      group="bookmark-folders"
      :animation="200"
      ghost-class="opacity-50"
      chosen-class="bg-accent/50"
              drag-class="drag-active"
      @end="onDragEnd"
      tag="div"
      class="min-h-[8px] border-l-2 border-dashed border-border/30 ml-2 pl-2"
    >
      <!-- 空状态拖拽区域 -->
      <div v-if="childrenModel.length === 0" class="h-6 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground">
        拖拽文件夹到此处成为子文件夹
      </div>
      <TreeNodeItem
        v-for="childFolder in childrenModel"
        :key="childFolder.id"
        :folder="childFolder"
        :selected-folder="selectedFolder"
        :level="level + 1"
        @select="$emit('select', $event)"
        @drag-end="$emit('drag-end', $event)"
      />
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [folderId: string];
  'drag-end': [event: any];
}>();

// 计算属性用于双向绑定子节点
const childrenModel = computed({
  get: () => props.folder.children,
  set: (value) => {
    // 直接更新引用
    props.folder.children = value;
  }
});

// 拖拽结束处理
const onDragEnd = (event: any) => {
  console.log('子节点拖拽结束:', event);
  emit('drag-end', {
    ...event,
    parentId: props.folder.id,
    level: props.level + 1
  });
};
</script>

