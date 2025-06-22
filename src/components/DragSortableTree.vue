<template>
  <div class="drag-sortable-tree">
    <!-- 使用提示 -->
    <div v-if="!hideAllBookmarks && flatTreeData.length > 0" class="usage-tip">
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

      <!-- 可拖拽的文件夹列表 - 使用扁平化结构 -->
      <VueDraggable
        v-model="flatTreeData"
        group="bookmark-folders"
        :animation="200"
        ghost-class="sortable-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        @end="onDragEnd"
        class="sortable-container"
      >
        <div
          v-for="folder in flatTreeData"
          :key="folder.id"
          class="tree-item folder-item"
          :class="{
            selected: selectedFolder === folder.id
          }"
          :style="{ paddingLeft: `${folder.level * 16}px` }"
          :data-folder-id="folder.id"
          @click="handleSelect(folder.id)"
        >
          <div class="tree-item-content">
            <n-icon class="tree-icon">
              <FolderOutline />
            </n-icon>
            <span class="tree-label">{{ folder.title }}</span>
            <n-text depth="3" class="tree-count" v-if="folder.count > 0">
              ({{ folder.count }})
            </n-text>
          </div>
        </div>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NIcon, NText } from '../utils/naive-ui';
import { BookmarksOutline, FolderOutline } from '@vicons/ionicons5';
import { message } from '../utils/naive-ui';
import type { Bookmark, BookmarkFolder } from '../utils/types';
import { VueDraggable } from 'vue-draggable-plus';
import { bookmarkService } from '../services/bookmarkService';

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
const treeData = ref<TreeNodeData[]>([]);

const buildNestedTree = () => {
  // 首先获取根级别的文件夹（书签栏和其他书签下的文件夹）
  const rootFolders = props.bookmarkFolders.filter(folder =>
    folder.parentId === '1' || folder.parentId === '2'
  );

  // 递归构建树形结构
  const buildChildren = (parentId: string, level: number = 0): TreeNodeData[] => {
    return props.bookmarkFolders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(folder => {
        const count = props.bookmarks.filter(b => b.parentId === folder.id).length;
        const children = buildChildren(folder.id, level + 1);

        return {
          id: folder.id,
          title: folder.title,
          count,
          parentId: folder.parentId,
          index: folder.index,
          level,
          children
        };
      });
  };

  // 构建完整的树形结构
  const result = rootFolders
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map(folder => {
      const count = props.bookmarks.filter(b => b.parentId === folder.id).length;
      const children = buildChildren(folder.id, 1);

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

  treeData.value = result;
};

// 监听数据变化，重新构建树
watch([() => props.bookmarkFolders, () => props.bookmarks], () => {
  buildNestedTree();
}, { immediate: true });

// 构建扁平化的树形数据
const flatTreeData = ref<TreeNodeData[]>([]);

const buildFlatTree = () => {
  const buildFlat = (parentId: string = '0', level: number = 0): TreeNodeData[] => {
    const nodes: TreeNodeData[] = [];

    // 查找当前层级的文件夹
    const currentLevelFolders = props.bookmarkFolders.filter(folder => {
      if (parentId === '0') {
        // 根级别：只显示直接在书签栏(ID: '1')和其他书签(ID: '2')下的文件夹
        return folder.parentId === '1' || folder.parentId === '2';
      } else {
        return folder.parentId === parentId;
      }
    });

    // 按index排序
    currentLevelFolders.sort((a, b) => {
      const indexA = typeof a.index === 'number' ? a.index : 999999;
      const indexB = typeof b.index === 'number' ? b.index : 999999;
      return indexA - indexB;
    });

    // 为每个文件夹创建节点
    currentLevelFolders.forEach((folder) => {
      if (!folder.title || folder.title.trim() === '') return;

      const count = props.bookmarks.filter(b => b.parentId === folder.id).length;

      nodes.push({
        id: folder.id,
        title: folder.title,
        count,
        parentId: folder.parentId,
        index: folder.index,
        level,
        children: []
      });

      // 递归添加子节点
      const children = buildFlat(folder.id, level + 1);
      nodes.push(...children);
    });

    return nodes;
  };

  flatTreeData.value = buildFlat();
};

// 监听数据变化，重新构建树
watch([() => props.bookmarkFolders, () => props.bookmarks], () => {
  buildFlatTree();
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

  console.log('=== 开始拖拽同步 ===');
  console.log('拖拽事件信息:', { oldIndex, newIndex, event });
  console.log('当前扁平数据:', flatTreeData.value.map(f => ({ id: f.id, title: f.title, level: f.level, parentId: f.parentId, index: f.index })));

  try {
    // 获取被拖拽的文件夹信息
    const draggedItem = event.item;
    const folderId = draggedItem?.getAttribute('data-folder-id');

    if (!folderId) {
      console.error('无法获取文件夹ID，DOM元素:', draggedItem);
      message.error('无法获取文件夹信息');
      return;
    }

    // 查找被拖拽的文件夹
    const draggedFolder = flatTreeData.value.find(f => f.id === folderId);
    if (!draggedFolder) {
      console.error('找不到被拖拽的文件夹，ID:', folderId);
      console.error('可用文件夹:', flatTreeData.value.map(f => f.id));
      message.error('找不到被拖拽的文件夹');
      return;
    }

    console.log('被拖拽的文件夹:', draggedFolder);

    // 获取当前书签的实际状态以计算正确的位置
    const [currentBookmark] = await bookmarkService.getChildren(draggedFolder.parentId || '1');

    // 计算新的位置
    const newPosition = calculateNewPosition(oldIndex, newIndex, draggedFolder);

    if (!newPosition) {
      console.error('无法计算新位置');
      message.error('无法计算新位置');
      return;
    }

    console.log('准备移动到新位置:', newPosition);

    // 防止无效移动（移动到自己或子级）
    if (await isInvalidMove(folderId, newPosition.parentId)) {
      console.warn('无效移动：试图移动到自己或子级文件夹');
      message.warning('不能将文件夹移动到自己或其子文件夹中');
      // 恢复原始位置
      buildFlatTree();
      return;
    }

    // 调用Chrome书签API移动文件夹
    const result = await bookmarkService.moveBookmark(folderId, {
      parentId: newPosition.parentId,
      index: newPosition.index
    });

    console.log('Chrome API 移动结果:', result);
    console.log('=== 拖拽同步完成 ===');

    // 获取移动后的所有信息进行详细报告
    const movedBookmark = await bookmarkService.getChildren(result.parentId!);
    const totalItems = await countTotalItemsInFolder(folderId);

    message.success(`成功移动文件夹 "${draggedFolder.title}" 及其 ${totalItems.folders} 个子文件夹和 ${totalItems.bookmarks} 个书签！`);

  } catch (error) {
    console.error('=== 拖拽同步失败 ===');
    console.error('错误详情:', error);

    // 恢复UI状态
    buildFlatTree();

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

// 计算新位置的函数 - 参考Chrome书签管理器实现
const calculateNewPosition = (oldIndex: number, newIndex: number, draggedFolder: TreeNodeData) => {
  console.log('计算新位置:', { oldIndex, newIndex, draggedFolder });

  // 获取目标位置的信息
  const targetFolder = flatTreeData.value[newIndex];
  const previousFolder = newIndex > 0 ? flatTreeData.value[newIndex - 1] : null;
  const nextFolder = newIndex < flatTreeData.value.length - 1 ? flatTreeData.value[newIndex + 1] : null;

  let parentId: string;
  let index: number;

  if (!targetFolder) {
    // 移动到列表末尾
    parentId = draggedFolder.parentId || '1';
    index = 999; // 移动到末尾
    console.log('移动到末尾');
  } else {
    // 确定正确的父级和索引
    if (oldIndex < newIndex) {
      // 向下移动 - 插入到目标位置之后
      parentId = targetFolder.parentId || '1';

      // 获取同级文件夹中目标文件夹的实际索引
      const siblings = flatTreeData.value.filter(f => f.parentId === parentId && f.level === targetFolder.level);
      const targetIndexInSiblings = siblings.findIndex(s => s.id === targetFolder.id);
      index = targetIndexInSiblings + 1;
    } else {
      // 向上移动 - 插入到目标位置之前
      parentId = targetFolder.parentId || '1';

      // 获取同级文件夹中目标文件夹的实际索引
      const siblings = flatTreeData.value.filter(f => f.parentId === parentId && f.level === targetFolder.level);
      const targetIndexInSiblings = siblings.findIndex(s => s.id === targetFolder.id);
      index = targetIndexInSiblings;
    }
  }

  // 确保父级ID有效
  if (!parentId || (parentId !== '1' && parentId !== '2' && !props.bookmarkFolders.find(f => f.id === parentId))) {
    parentId = '1'; // 默认使用书签栏
  }

  console.log('最终计算结果:', { parentId, index, targetFolder });

  return {
    parentId,
    index
  };
};

// 检查是否为无效移动（移动到自己或子级）
const isInvalidMove = async (folderId: string, targetParentId: string): Promise<boolean> => {
  if (folderId === targetParentId) {
    return true;
  }

  // 检查是否移动到子级文件夹
  const checkDescendant = (parentId: string): boolean => {
    const children = props.bookmarkFolders.filter(f => f.parentId === parentId);
    for (const child of children) {
      if (child.id === targetParentId) {
        return true;
      }
      if (checkDescendant(child.id)) {
        return true;
      }
    }
    return false;
  };

  return checkDescendant(folderId);
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

/* 文件夹项目样式 */
.tree-item.folder-item {
  background: transparent;
  color: var(--n-text-color);
  border-radius: 6px;
  margin: 2px 0;
  min-height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tree-item.folder-item:hover {
  background: var(--n-color-target);
}

.tree-item.folder-item.selected {
  background: var(--n-primary-color-suppl);
  color: var(--n-primary-color);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .sortable-drag {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}
</style>