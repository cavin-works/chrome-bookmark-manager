<template>
  <div
    class="relative"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 拖拽位置指示器 - before -->
    <div
      v-if="showLineBefore"
      class="absolute -top-px left-0 right-0 h-0.5 bg-primary z-10"
    ></div>

    <!-- 树节点内容 -->
    <div
      :class="cn(
        'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        selectedFolder === node.key && 'bg-accent text-accent-foreground font-medium',
        showBlock && 'bg-accent/50 ring-1 ring-primary',
        isDragging && 'opacity-50',
        isChildBeingDragged && 'opacity-30',
        hasDraggedChildren && 'ring-1 ring-destructive'
      )"
      @click="handleSelect"
    >
      <component
        :is="iconComponent"
        class="h-4 w-4 text-muted-foreground"
      />
      <span class="flex-1 truncate text-sm">{{ node.label }}</span>
      <Badge variant="secondary" class="h-5 text-xs">{{ node.count }}</Badge>
    </div>

    <!-- 拖拽位置指示器 - after -->
    <div
      v-if="showLineAfter"
      class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary z-10"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder, FolderOpen } from 'lucide-vue-next';

interface TreeNodeData {
  key: string;
  label: string;
  count: number;
  isFolder: boolean;
  parentId?: string;
  index?: number;
  level: number;
}

interface DragState {
  isDragging: boolean;
  draggedNode?: TreeNodeData;
  dropTarget?: {
    nodeId: string;
    position: 'before' | 'after' | 'inside';
  };
  draggedDescendants?: string[];
}

interface Props {
  node: TreeNodeData;
  selectedFolder: string;
  dragState: DragState;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [folderId: string];
  'drag-over': [nodeId: string, position: 'before' | 'after' | 'inside'];
  'drag-leave': [];
  drop: [nodeId: string, position: 'before' | 'after' | 'inside'];
}>();

// 拖拽位置状态
const dragPosition = ref<'before' | 'after' | 'inside' | null>(null);

// 是否正在拖拽当前节点
const isDragging = computed(() => {
  return props.dragState.isDragging &&
         props.dragState.draggedNode?.key === props.node.key;
});

// 是否为被拖拽节点的子级
const isChildBeingDragged = computed(() => {
  return props.dragState.isDragging &&
         props.dragState.draggedDescendants?.includes(props.node.key);
});

// 是否有子级正在被拖拽
const hasDraggedChildren = computed(() => {
  return props.dragState.isDragging &&
         props.dragState.draggedNode?.key === props.node.key &&
         props.dragState.draggedDescendants &&
         props.dragState.draggedDescendants.length > 0;
});

// 是否展开（这里简化处理）
const isExpanded = computed(() => false);

// 图标组件
const iconComponent = computed(() => {
  return isExpanded.value ? FolderOpen : Folder;
});

// 显示高亮线 - before
const showLineBefore = computed(() => {
  return props.dragState.dropTarget?.nodeId === props.node.key &&
         props.dragState.dropTarget?.position === 'before';
});

// 显示高亮线 - after
const showLineAfter = computed(() => {
  return props.dragState.dropTarget?.nodeId === props.node.key &&
         props.dragState.dropTarget?.position === 'after';
});

// 显示高亮块
const showBlock = computed(() => {
  return props.dragState.dropTarget?.nodeId === props.node.key &&
         props.dragState.dropTarget?.position === 'inside' &&
         props.node.isFolder;
});

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  if (!props.dragState.isDragging) return;

  event.preventDefault();

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const y = event.clientY - rect.top;
  const height = rect.height;

  let position: 'before' | 'after' | 'inside';

  // 三分区检测
  if (y < height / 3) {
    position = 'before';
  } else if (y > height * 2 / 3) {
    position = 'after';
  } else {
    // 中间区域：如果是文件夹则内部插入，否则根据位置决定前后
    position = props.node.isFolder ? 'inside' : (y < height / 2 ? 'before' : 'after');
  }

  dragPosition.value = position;
  emit('drag-over', props.node.key, position);
};

// 处理拖拽离开
const handleDragLeave = (event: DragEvent) => {
  // 只有当鼠标真正离开元素时才触发
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dragPosition.value = null;
    emit('drag-leave');
  }
};

// 处理放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault();

  if (dragPosition.value) {
    emit('drop', props.node.key, dragPosition.value);
    dragPosition.value = null;
  }
};

// 处理选择
const handleSelect = () => {
  emit('select', props.node.key);
};
</script>

