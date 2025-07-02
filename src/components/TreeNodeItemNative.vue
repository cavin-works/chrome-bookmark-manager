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
    <div
      class="flex items-center py-2 px-2 rounded-md hover:bg-accent/50 transition-colors"
      @contextmenu.prevent="handleContextMenu"
    >
      <Folder class="mr-2 h-4 w-4 text-muted-foreground" />

      <!-- 正常显示模式 -->
      <span v-if="!isRenaming" class="flex-1 text-sm truncate">{{ folder.title }}</span>

      <!-- 重命名输入框 -->
      <input
        v-else
        ref="renameInput"
        v-model="newName"
        class="flex-1 text-sm bg-background border border-primary rounded px-1 py-0.5 outline-none"
        @keyup.enter="confirmRename"
        @keyup.esc="cancelRename"
        @blur="confirmRename"
      />

      <Badge v-if="folder.count > 0" variant="secondary" class="ml-auto text-xs">
        {{ folder.count }}
      </Badge>
    </div>

         <!-- 右键菜单 -->
     <Teleport to="body">
       <div
         v-if="showContextMenu"
         class="context-menu"
         :style="menuPosition"
         @click.stop
       >
         <div class="menu-item" @click="handleRename">
           <Edit class="mr-2 h-3 w-3" />
           重命名
         </div>
         <div class="menu-item danger" @click="handleDelete">
           <Trash2 class="mr-2 h-3 w-3" />
           删除
         </div>
       </div>
     </Teleport>

     <!-- 删除确认对话框 -->
     <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
       <AlertDialogContent class="sm:max-w-[425px]">
         <AlertDialogHeader>
           <AlertDialogTitle class="flex items-center gap-2 text-destructive">
             <Trash2 class="h-5 w-5" />
             确认删除
           </AlertDialogTitle>
           <AlertDialogDescription>
             确定要删除文件夹"<strong>{{ folder.title }}</strong>"吗？
             <br /><br />
             <span class="text-destructive text-sm">
               ⚠️ 删除后文件夹中的所有书签和子文件夹也会被永久删除，此操作无法撤销。
             </span>
           </AlertDialogDescription>
         </AlertDialogHeader>

         <AlertDialogFooter class="gap-2">
           <AlertDialogCancel>
             取消
           </AlertDialogCancel>
           <AlertDialogAction
             @click="confirmDelete"
             class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
           >
             <Trash2 class="mr-2 h-4 w-4" />
             确认删除
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>

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
      @move-bookmark="$emit('move-bookmark', $event)"
      @rename-folder="$emit('rename-folder', $event)"
      @delete-folder="$emit('delete-folder', $event)"
      @reorder="$emit('reorder')"
      @drag-start="$emit('drag-start', $event)"
      @drag-end="$emit('drag-end')"
      @drag-enter="$emit('drag-enter', $event)"
      @drag-leave="$emit('drag-leave', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Folder, Edit, Trash2 } from 'lucide-vue-next';
import type { Bookmark } from '@/utils/types';

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
  isBookmarkDrag: boolean;
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
  'move-bookmark': [moveData: {
    bookmarkId: string;
    targetFolderId: string;
    bookmark: Bookmark;
  }];
  'rename-folder': [data: { folderId: string; newName: string }];
  'delete-folder': [folderId: string];
  reorder: [];
  'drag-start': [folderId: string];
  'drag-end': [];
  'drag-enter': [data: { folderId: string; position: 'before' | 'after' | 'inside' }];
  'drag-leave': [folderId: string];
}>();

// 计算属性
const isSelected = computed(() => props.selectedFolder === props.folder.id);
const isCurrentDropTarget = computed(() =>
  props.globalDragState.currentDropTarget === props.folder.id ||
  (isBookmarkDragging.value && props.folder.id === currentBookmarkDropTarget.value)
);

// 书签拖拽状态
const currentBookmarkDropTarget = ref('');

// 拖拽超时处理
let dragLeaveTimeout: number | null = null;

// 本地书签拖拽状态
const isBookmarkDragging = ref(false);

// 右键菜单状态
const showContextMenu = ref(false);
const menuPosition = ref({ top: '0px', left: '0px' });

// 重命名状态
const isRenaming = ref(false);
const newName = ref('');
const renameInput = ref<HTMLInputElement>();

// 删除确认状态
const showDeleteConfirm = ref(false);

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

  // 检查是否是书签拖拽
  const bookmarkData = event.dataTransfer?.types.includes('application/x-bookmark');

  if (bookmarkData) {
    // 设置书签拖拽状态
    isBookmarkDragging.value = true;
    currentBookmarkDropTarget.value = props.folder.id;

    // 书签拖拽只允许放入文件夹内部
    emit('drag-enter', { folderId: props.folder.id, position: 'inside' });
    return;
  }

  // 原有的文件夹拖拽逻辑
  if (!props.globalDragState.isDragging ||
      props.globalDragState.draggedFolderId === props.folder.id) {
    return;
  }

  const position = calculateDragPosition(event);
  emit('drag-enter', { folderId: props.folder.id, position });
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();

  // 检查是否是书签拖拽
  const bookmarkData = event.dataTransfer?.types.includes('application/x-bookmark');

  if (bookmarkData) {
    // 设置书签拖拽状态
    isBookmarkDragging.value = true;
    currentBookmarkDropTarget.value = props.folder.id;

    event.dataTransfer!.dropEffect = 'move';
    emit('drag-enter', { folderId: props.folder.id, position: 'inside' });
    return;
  }

  // 原有的文件夹拖拽逻辑
  if (!props.globalDragState.isDragging ||
      props.globalDragState.draggedFolderId === props.folder.id) {
    return;
  }

  event.dataTransfer!.dropEffect = 'move';

  const position = calculateDragPosition(event);
  emit('drag-enter', { folderId: props.folder.id, position });
};

const handleDragLeave = (event: DragEvent) => {
  // 清除书签拖拽状态
  if (currentBookmarkDropTarget.value === props.folder.id) {
    currentBookmarkDropTarget.value = '';
  }

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

  if (!event.dataTransfer) return;

  // 首先检查是否是书签拖拽
  const bookmarkData = event.dataTransfer.getData('application/x-bookmark');

  if (bookmarkData) {
    // 清除书签拖拽状态
    isBookmarkDragging.value = false;
    currentBookmarkDropTarget.value = '';

    // 处理书签移动到文件夹
    try {
      const bookmark: Bookmark = JSON.parse(bookmarkData);

      // 检查是否拖拽到同一个父文件夹
      if (bookmark.parentId === props.folder.id) {
        console.log('书签已在当前文件夹中');
        return;
      }

      // 发送书签移动事件
      const moveData = {
        bookmarkId: bookmark.id,
        targetFolderId: props.folder.id,
        bookmark: bookmark
      };

      console.log('执行书签移动:', moveData);
      emit('move-bookmark', moveData);

    } catch (error) {
      console.error('解析书签数据失败:', error);
    }
    return;
  }

  // 原有的文件夹移动逻辑
  if (!props.globalDragState.dragPosition) return;

  const sourceId = event.dataTransfer.getData('text/plain');
  if (!sourceId || sourceId === props.folder.id) return;

  // 检查是否试图移动到子文件夹
  if (isMovingToChild(sourceId, props.folder.id)) {
    console.warn('不能将文件夹移动到自己的子文件夹中');
    return;
  }

  // 发送文件夹移动事件
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

  // 如果是书签拖拽，显示特殊的高亮样式
  if (isBookmarkDragging.value && currentBookmarkDropTarget.value === props.folder.id) {
    return 'bookmark-drop-target';
  }

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

// 右键菜单处理
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  // 如果正在拖拽，不显示右键菜单
  if (props.globalDragState.isDragging || isBookmarkDragging.value) {
    return;
  }

  // 计算菜单位置，确保不超出视窗
  const x = event.clientX;
  const y = event.clientY;
  const menuWidth = 120;
  const menuHeight = 80;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = Math.min(x, viewportWidth - menuWidth);
  const top = Math.min(y, viewportHeight - menuHeight);

  menuPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  };

  showContextMenu.value = true;

  // 添加全局点击监听，点击外部关闭菜单
  const closeMenu = () => {
    showContextMenu.value = false;
    document.removeEventListener('click', closeMenu);
  };

  // 延迟添加监听，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
};

const handleRename = () => {
  showContextMenu.value = false;
  isRenaming.value = true;
  newName.value = props.folder.title;

  // 下一帧聚焦输入框并选中文本
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
      renameInput.value.select();
    }
  });
};

const confirmRename = () => {
  if (newName.value.trim() && newName.value.trim() !== props.folder.title) {
    emit('rename-folder', {
      folderId: props.folder.id,
      newName: newName.value.trim()
    });
  }
  isRenaming.value = false;
};

const cancelRename = () => {
  isRenaming.value = false;
  newName.value = props.folder.title;
};

const handleDelete = () => {
  showContextMenu.value = false;
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  emit('delete-folder', props.folder.id);
};

// 监听全局拖拽结束事件，清理书签拖拽状态
onMounted(() => {
  const handleGlobalDragEnd = () => {
    isBookmarkDragging.value = false;
    currentBookmarkDropTarget.value = '';
  };

  const handleGlobalClick = () => {
    showContextMenu.value = false;
    if (isRenaming.value) {
      confirmRename();
    }
  };

  document.addEventListener('dragend', handleGlobalDragEnd);

  onUnmounted(() => {
    document.removeEventListener('dragend', handleGlobalDragEnd);
    showContextMenu.value = false;
  });
});
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

.folder-item.bookmark-drop-target {
  background: hsl(var(--accent));
  border: 2px dashed hsl(var(--primary));
  border-radius: 6px;
  transform: scale(1.02);
}

.folder-item.bookmark-drop-target .drop-indicator {
  background: hsl(var(--primary));
  opacity: 0.8;
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

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 1000;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  padding: 4px 0;
  backdrop-filter: blur(8px);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.15s ease;
  user-select: none;
}

.menu-item:hover {
  background: hsl(var(--accent));
}

.menu-item.danger {
  color: hsl(var(--destructive));
}

.menu-item.danger:hover {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}
</style>