<template>
  <div class="drag-sortable-tree">
    <!-- 使用提示 -->
    <div v-if="!hideAllBookmarks && nestedTreeData.length > 0" class="usage-tip">
      <n-text depth="3" style="font-size: 12px;">
        💡 提示：拖拽文件夹进行排序，Chrome会自动移动其所有子内容。智能防护确保不会移动到错误位置。
      </n-text>
    </div>

    <div class="tree-container">
      <!-- 全部书签 -->
      <div
        v-if="!hideAllBookmarks"
        class="tree-item all-bookmarks"
        :class="{ selected: selectedFolder === '' }"
        @click="handleSelect('')"
      >
        <div class="tree-item-content">
          <n-icon class="tree-icon">
            <BookmarksOutline />
          </n-icon>
          <span class="tree-label">全部书签</span>
          <n-text depth="3" class="tree-count">({{ totalBookmarks }})</n-text>
        </div>
      </div>

      <!-- 嵌套的可拖拽文件夹列表 -->
      <VueDraggable
        v-model="nestedTreeData"
        group="bookmark-folders"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        @end="onDragEnd"
        class="sortable-container"
        tag="div"
      >
        <TreeNodeItem
          v-for="folder in nestedTreeData"
          :key="folder.id"
          :folder="folder"
          :selected-folder="selectedFolder"
          :level="0"
          @select="handleTreeSelect"
        />
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineOptions } from 'vue';
import { NIcon, NText } from '../utils/naive-ui';
import { BookmarksOutline } from '@vicons/ionicons5';
import { message } from '../utils/naive-ui';
import type { Bookmark, BookmarkFolder } from '../utils/types';
import { VueDraggable } from 'vue-draggable-plus';
import { bookmarkService } from '../services/bookmarkService';
import TreeNodeItem from './TreeNodeItem.vue';

// 设置组件名，支持递归
defineOptions({
  name: 'DragSortableTree'
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

interface Props {
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  selectedFolder?: string;
  hideAllBookmarks?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedFolder: '',
  hideAllBookmarks: false
});

const emit = defineEmits<{
  select: [folderId: string];
  reorder: [];
}>();

// 计算总书签数
const totalBookmarks = computed(() => props.bookmarks.length);

// 构建嵌套的树形数据
const nestedTreeData = ref<TreeNodeData[]>([]);

const buildNestedTree = () => {
  // 递归构建子节点
  const buildChildren = (parentId: string): TreeNodeData[] => {
    return props.bookmarkFolders
      .filter(folder => folder.parentId === parentId && folder.title && folder.title.trim() !== '')
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(folder => {
        const count = props.bookmarks.filter(b => b.parentId === folder.id).length;
        const children = buildChildren(folder.id);

        return {
          id: folder.id,
          title: folder.title,
          count,
          parentId: folder.parentId,
          index: folder.index,
          level: 0, // level将由组件计算
          children
        };
      });
  };

  // 构建根级别的文件夹（书签栏和其他书签下的文件夹）
  const rootFolders = props.bookmarkFolders
    .filter(folder =>
      (folder.parentId === '1' || folder.parentId === '2') &&
      folder.title && folder.title.trim() !== ''
    )
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map(folder => {
      const count = props.bookmarks.filter(b => b.parentId === folder.id).length;
      const children = buildChildren(folder.id);

      return {
        id: folder.id,
        title: folder.title,
        count,
        parentId: folder.parentId,
        index: folder.index,
        level: 0,
        children
      };
    });

  nestedTreeData.value = rootFolders;
};

// 监听数据变化，重新构建树
watch([() => props.bookmarkFolders, () => props.bookmarks], () => {
  buildNestedTree();
}, { immediate: true });

// 处理选择
const handleSelect = (folderId: string) => {
  emit('select', folderId);
};

// 处理重新排序
const handleReorder = () => {
  emit('reorder');
};

// 处理拖拽结束
const onDragEnd = async (event: any) => {
  const { oldIndex, newIndex } = event;

  if (oldIndex === newIndex) {
    console.log('位置未改变，跳过同步');
    return;
  }

  console.log('=== 开始嵌套拖拽同步 ===');
  console.log('拖拽事件信息:', { oldIndex, newIndex, event });

  try {
    // 直接使用nestedTreeData中被拖拽的项目
    const draggedFolder = nestedTreeData.value[oldIndex];
    if (!draggedFolder) {
      console.error('找不到被拖拽的文件夹');
      message.error('找不到被拖拽的文件夹');
      return;
    }

    console.log('被拖拽的文件夹:', draggedFolder);

    // 计算新的位置 - 同级移动
    const targetFolder = nestedTreeData.value[newIndex];
    const parentId = draggedFolder.parentId || '1';

    // 调用Chrome书签API移动文件夹
    const result = await bookmarkService.moveBookmark(draggedFolder.id, {
      parentId: parentId,
      index: newIndex
    });

    console.log('Chrome API 移动结果:', result);
    console.log('=== 嵌套拖拽同步完成 ===');

    // 统计移动的项目
    const totalItems = await countTotalItemsInFolder(draggedFolder.id);
    message.success(`成功移动文件夹 "${draggedFolder.title}" 及其 ${totalItems.folders} 个子文件夹和 ${totalItems.bookmarks} 个书签！`);

  } catch (error) {
    console.error('=== 嵌套拖拽同步失败 ===');
    console.error('错误详情:', error);

    // 恢复UI状态
    buildNestedTree();

    if (error instanceof Error) {
      if (error.message.includes('descendant')) {
        message.error('不能将文件夹移动到自己的子文件夹中');
      } else {
        message.error(`移动失败: ${error.message}`);
      }
    } else {
      message.error('移动书签失败，请重试');
    }
  }

  // 延迟刷新数据以确保同步完成
  setTimeout(() => {
    console.log('触发数据重新加载');
    emit('reorder');
  }, 300);
};

// 递归处理选择事件
const handleTreeSelect = (folderId: string) => {
  emit('select', folderId);
};

// 计算文件夹中的总项目数
const countTotalItemsInFolder = async (folderId: string): Promise<{folders: number, bookmarks: number}> => {
  const countItems = (parentId: string): {folders: number, bookmarks: number} => {
    const childFolders = props.bookmarkFolders.filter(f => f.parentId === parentId);
    const childBookmarks = props.bookmarks.filter(b => b.parentId === parentId);

    let totalFolders = childFolders.length;
    let totalBookmarks = childBookmarks.length;

    // 递归计算子文件夹中的项目
    for (const folder of childFolders) {
      const childCounts = countItems(folder.id);
      totalFolders += childCounts.folders;
      totalBookmarks += childCounts.bookmarks;
    }

    return { folders: totalFolders, bookmarks: totalBookmarks };
  };

  return countItems(folderId);
};
</script>

<style scoped>
/* 使用提示 */
.usage-tip {
  padding: 8px 12px;
  margin: 4px 0;
  background: var(--n-color-target);
  border-radius: 6px;
  border-left: 3px solid var(--n-primary-color);
}

.drag-sortable-tree {
  height: 100%;
  overflow: hidden;
}

.tree-container {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

/* 全部书签样式 */
.tree-item.all-bookmarks {
  background: transparent;
  color: var(--n-text-color);
  font-weight: 500;
  border-radius: 6px;
  margin: 4px 0 8px 0;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tree-item.all-bookmarks:hover {
  background: var(--n-color-target);
}

.tree-item.all-bookmarks.selected {
  background: var(--n-primary-color-suppl);
  color: var(--n-primary-color);
}

/* 树项目内容 */
.tree-item-content {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  height: 100%;
  box-sizing: border-box;
}

.tree-icon {
  font-size: 16px;
  margin-right: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.tree-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.tree-count {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.7;
}

/* 拖拽容器样式 */
.sortable-container {
  position: relative;
}

/* 拖拽状态样式 */
.sortable-ghost {
  opacity: 0.4;
  background: var(--n-color-target);
}

.sortable-chosen {
  cursor: grabbing;
}

.sortable-drag {
  opacity: 0.9;
  transform: rotate(1deg) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  border-radius: 6px;
  background: var(--n-card-color);
}

/* 这些样式已移到TreeNodeItem.vue中 */

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .sortable-drag {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}
</style>