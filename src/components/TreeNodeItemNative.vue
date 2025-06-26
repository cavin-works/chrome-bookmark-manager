<template>
  <div
    :class="cn(
      'relative group',
      'folder-item',
      isSelected && 'bg-accent text-accent-foreground font-medium',
      isDragging && 'opacity-50',
      dragPosition === 'before' && 'insert-before',
      dragPosition === 'after' && 'insert-after',
      dragPosition === 'inside' && 'drag-over'
    )"
    :style="{ paddingLeft: `${level * 16 + 8}px` }"
    :data-folder-id="folder.id"
    draggable="true"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 拖拽位置指示器 -->
    <div
      v-if="dragPosition === 'before'"
      class="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full drop-indicator"
    ></div>
    <div
      v-if="dragPosition === 'after'"
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full drop-indicator"
    ></div>
    <div
      v-if="dragPosition === 'inside'"
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

    <!-- 子文件夹 -->
    <div v-if="folder.children && folder.children.length > 0" class="mt-1">
      <TreeNodeItemNative
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :selected-folder="selectedFolder"
        :level="level + 1"
        :all-folders="allFolders"
        @select="$emit('select', $event)"
        @move="$emit('move', $event)"
        @reorder="$emit('reorder')"
      />
    </div>
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

interface Props {
  folder: TreeNodeData;
  selectedFolder: string;
  level: number;
  allFolders: BookmarkFolder[];
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
}>();

// 响应式状态
const isDragging = ref(false);
const dragPosition = ref<'before' | 'after' | 'inside' | null>(null);

// 计算属性
const isSelected = computed(() => props.selectedFolder === props.folder.id);

// 拖拽数据存储
let draggedFolderId = '';

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

  isDragging.value = true;
  draggedFolderId = props.folder.id;

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', props.folder.id);
  event.dataTransfer.effectAllowed = 'move';

  console.log('开始拖拽文件夹:', props.folder.title);
};

const handleDragEnd = () => {
  isDragging.value = false;
  dragPosition.value = null;
  draggedFolderId = '';

  // 清理所有元素的拖拽状态
  document.querySelectorAll('.folder-item').forEach(el => {
    el.classList.remove('drag-over', 'insert-before', 'insert-after');
  });

  console.log('拖拽结束');
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer || draggedFolderId === props.folder.id) return;

  updateDragPosition(event);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer || draggedFolderId === props.folder.id) return;

  event.dataTransfer.dropEffect = 'move';
  updateDragPosition(event);
};

const handleDragLeave = (event: DragEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement;
  const currentElement = event.currentTarget as HTMLElement;

  // 如果鼠标移动到子元素，不清除状态
  if (!relatedTarget || !currentElement.contains(relatedTarget)) {
    dragPosition.value = null;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!event.dataTransfer || !dragPosition.value) return;

  const sourceId = event.dataTransfer.getData('text/plain');
  if (!sourceId || sourceId === props.folder.id) return;

  // 检查是否试图移动到子文件夹
  if (isMovingToChild(sourceId, props.folder.id)) {
    console.warn('不能将文件夹移动到自己的子文件夹中');
    dragPosition.value = null;
    return;
  }

  // 发送移动事件
  const moveData = {
    sourceId,
    targetId: props.folder.id,
    position: dragPosition.value,
    sourceIndex: findFolderIndex(sourceId),
    targetIndex: findFolderIndex(props.folder.id)
  };

  console.log('执行文件夹移动:', moveData);
  emit('move', moveData);

  // 清理状态
  dragPosition.value = null;
};

// 辅助函数
const updateDragPosition = (event: DragEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const mouseY = event.clientY;
  const elementHeight = rect.height;
  const relativeY = mouseY - rect.top;

  // 将元素分为三个区域：上1/4、中间1/2、下1/4
  const upperThreshold = elementHeight * 0.25;
  const lowerThreshold = elementHeight * 0.75;

  if (relativeY < upperThreshold) {
    dragPosition.value = 'before';
  } else if (relativeY > lowerThreshold) {
    dragPosition.value = 'after';
  } else {
    dragPosition.value = 'inside';
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