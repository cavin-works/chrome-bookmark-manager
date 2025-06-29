<template>
  <div
    :class="cn(
      'relative group',
      'folder-item',
      isSelected && 'bg-accent text-accent-foreground font-medium',
      globalDragState.draggedFolderId === folder.id && 'opacity-50',
      isCurrentDropTarget && getDropIndicatorClass()
    )"
    :style="{ paddingLeft: `${level * 16 + 8}px` }"
    :data-folder-id="folder.id"
    draggable="true"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragenter.stop="handleDragEnter"
    @dragover.prevent.stop="handleDragOver"
    @dragleave.stop="handleDragLeave"
    @drop.prevent.stop="handleDrop"
  >
    <!-- 拖拽位置指示器 -->
    <div
      v-if="isCurrentDropTarget && globalDragState.dragPosition === 'before'"
      class="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full drop-indicator"
    ></div>
    <div
      v-if="isCurrentDropTarget && globalDragState.dragPosition === 'after'"
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full drop-indicator"
    ></div>
    <div
      v-if="isCurrentDropTarget && globalDragState.dragPosition === 'inside'"
      class="absolute inset-0 border-2 border-primary border-dashed rounded-md opacity-50"
    ></div>

    <!-- 文件夹内容 -->
    <div class="flex items-center py-2 px-2 rounded-md hover:bg-accent/50 transition-colors">
      <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
      <span class="flex-1 text-sm truncate">{{ folder.title }}</span>
      <Badge v-if="folder.count > 0" variant="secondary" class="ml-auto text-xs">
        {{ folder.count }}
      </Badge>
    </div>

    <!-- 子文件夹 - 移到外层容器以避免事件冲突 -->
  </div>

  <!-- 子文件夹独立容器 -->
  <div v-if="folder.children && folder.children.length > 0" class="mt-1">
    <TreeNodeItemNative
      v-for="child in folder.children"
      :key="child.id"
      :folder="child"
      :selected-folder="selectedFolder"
      :level="level + 1"
      :all-folders="allFolders"
      :global-drag-state="globalDragState"
      @select="$emit('select', $event)"
      @move="$emit('move', $event)"
      @reorder="$emit('reorder')"
      @drag-start="$emit('drag-start', $event)"
      @drag-end="$emit('drag-end')"
      @drag-enter="$emit('drag-enter', $event)"
      @drag-leave="$emit('drag-leave', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-vue-next';

// 递归组件设置
defineOptions({
  name: 'TreeNodeItemNative'
});

interface TreeNodeData {
  id: string;
  title: string;
  count: number;
  parentId?: string;
  index?: number;
  level: number;
  children: TreeNodeData[];
}

interface BookmarkFolder {
  id: string;
  title: string;
  parentId?: string;
  index?: number;
}

interface GlobalDragState {
  isDragging: boolean;
  draggedFolderId: string;
  currentDropTarget: string;
  dragPosition: 'before' | 'after' | 'inside' | null;
}

interface Props {
  folder: TreeNodeData;
  selectedFolder: string;
  level: number;
  allFolders: BookmarkFolder[];
  globalDragState: GlobalDragState;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [folderId: string];
  move: [moveData: {
    sourceId: string;
    targetId: string;
    position: 'before' | 'after' | 'inside';
    sourceIndex: number;
    targetIndex: number;
  }];
  reorder: [];
  'drag-start': [folderId: string];
  'drag-end': [];
  'drag-enter': [data: { folderId: string; position: 'before' | 'after' | 'inside' }];
  'drag-leave': [folderId: string];
}>();

// 计算属性
const isSelected = computed(() => props.selectedFolder === props.folder.id);
const isCurrentDropTarget = computed(() =>
  props.globalDragState.currentDropTarget === props.folder.id
);

// 拖拽超时处理
let dragLeaveTimeout: number | null = null;

// 事件处理
const handleClick = (event: MouseEvent) => {
  // 如果点击的是按钮，不处理选择
  if ((event.target as HTMLElement).tagName === 'BUTTON') {
    return;
  }
  emit('select', props.folder.id);
};

const handleDragStart = (event: DragEvent) => {
  // 如果点击的是按钮，不启动拖拽
  if ((event.target as HTMLElement).tagName === 'BUTTON') {
    event.preventDefault();
    return;
  }

  if (!event.dataTransfer) return;

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', props.folder.id);
  event.dataTransfer.effectAllowed = 'move';

  // 通知全局拖拽开始
  emit('drag-start', props.folder.id);

  console.log('开始拖拽文件夹:', props.folder.title);
};

const handleDragEnd = () => {
  // 通知全局拖拽结束
  emit('drag-end');
  console.log('拖拽结束');
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();

  // 清除之前的超时
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }

  if (!props.globalDragState.isDragging ||
      props.globalDragState.draggedFolderId === props.folder.id) {
    return;
  }

  const position = calculateDragPosition(event);
  emit('drag-enter', { folderId: props.folder.id, position });
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();

  if (!props.globalDragState.isDragging ||
      props.globalDragState.draggedFolderId === props.folder.id) {
    return;
  }

  event.dataTransfer!.dropEffect = 'move';

  const position = calculateDragPosition(event);
  emit('drag-enter', { folderId: props.folder.id, position });
};

const handleDragLeave = (event: DragEvent) => {
  // 使用超时来避免快速进出导致的状态闪烁
  dragLeaveTimeout = setTimeout(() => {
    emit('drag-leave', props.folder.id);
  }, 50);
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();

  // 清除超时
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }

  if (!event.dataTransfer || !props.globalDragState.dragPosition) return;

  const sourceId = event.dataTransfer.getData('text/plain');
  if (!sourceId || sourceId === props.folder.id) return;

  // 检查是否试图移动到子文件夹
  if (isMovingToChild(sourceId, props.folder.id)) {
    console.warn('不能将文件夹移动到自己的子文件夹中');
    return;
  }

  // 发送移动事件
  const moveData = {
    sourceId,
    targetId: props.folder.id,
    position: props.globalDragState.dragPosition,
    sourceIndex: findFolderIndex(sourceId),
    targetIndex: findFolderIndex(props.folder.id)
  };

  console.log('执行文件夹移动:', moveData);
  emit('move', moveData);
};

// 辅助函数
const calculateDragPosition = (event: DragEvent): 'before' | 'after' | 'inside' => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const mouseY = event.clientY;
  const elementHeight = rect.height;
  const relativeY = mouseY - rect.top;

  // 将元素分为三个区域：上1/4、中间1/2、下1/4
  const upperThreshold = elementHeight * 0.25;
  const lowerThreshold = elementHeight * 0.75;

  if (relativeY < upperThreshold) {
    return 'before';
  } else if (relativeY > lowerThreshold) {
    return 'after';
  } else {
    return 'inside';
  }
};

const getDropIndicatorClass = (): string => {
  if (!isCurrentDropTarget.value) return '';

  switch (props.globalDragState.dragPosition) {
    case 'before':
      return 'insert-before';
    case 'after':
      return 'insert-after';
    case 'inside':
      return 'drag-over';
    default:
      return '';
  }
};

const findFolderIndex = (folderId: string): number => {
  const folder = props.allFolders.find(f => f.id === folderId);
  return folder?.index || 0;
};

// 检查是否试图移动到子文件夹
const isMovingToChild = (sourceId: string, targetId: string): boolean => {
  const checkDescendant = (folderId: string): boolean => {
    if (folderId === sourceId) {
      return true;
    }

    const childFolders = props.allFolders.filter(f => f.parentId === folderId);
    for (const child of childFolders) {
      if (checkDescendant(child.id)) {
        return true;
      }
    }

    return false;
  };

  return checkDescendant(targetId);
};
</script>

<style scoped>
.folder-item {
  transition: all 0.2s ease;
}

.folder-item.insert-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: hsl(var(--primary));
  border-radius: 1px;
  box-shadow: 0 0 4px hsl(var(--primary));
}

.folder-item.insert-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: hsl(var(--primary));
  border-radius: 1px;
  box-shadow: 0 0 4px hsl(var(--primary));
}

.folder-item.drag-over {
  background: hsl(var(--accent));
  border: 2px dashed hsl(var(--primary));
  border-radius: 6px;
}

.drop-indicator {
  box-shadow: 0 0 6px hsl(var(--primary));
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>