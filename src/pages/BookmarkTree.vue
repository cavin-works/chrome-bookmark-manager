<template>
  <div class="bookmark-tree">
    <div class="space-y-1">
      <div
        v-for="node in treeData"
        :key="node.key"
        class="relative my-0.5"
      >
        <TreeNodeComponent
          :node="node"
          :level="0"
          :selected-keys="selectedKeys"
          :expanded-keys="expandedKeys"
          @select="handleSelect"
          @expand="handleExpand"
          @drop="handleDrop"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue';
import { NTree, NIcon, NText } from '../utils/naive-ui';
import { BookmarksOutline, FolderOutline, FolderOpenOutline } from '@vicons/ionicons5';
import { bookmarkService } from '../services/bookmarkService';
import { message } from '../utils/naive-ui';
import type { Bookmark, BookmarkFolder } from '../utils/types';

interface TreeNode extends Record<string, unknown> {
  key: string;
  label: string;
  children?: TreeNode[];
  count?: number;
  isFolder: boolean;
  parentId?: string;
  index?: number;
}

// Props
interface Props {
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  selectedFolder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedFolder: ''
});

// Emits
const emit = defineEmits<{
  select: [folderId: string];
  reorder: []; // 通知父组件重新加载数据
}>();

// 响应式数据
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>(['0']); // 默认展开根节点

// 计算书签数量
const getBookmarkCount = (folderId: string): number => {
  return props.bookmarks.filter(bookmark => bookmark.parentId === folderId).length;
};

// 构建树形数据
const treeData = computed(() => {
  // 构建文件夹映射
  const folderMap = new Map<string, BookmarkFolder>();
  props.bookmarkFolders.forEach(folder => {
    folderMap.set(folder.id, folder);
  });

  // 构建树形结构
  const buildTree = (parentId: string = '0'): TreeNode[] => {
    const nodes: TreeNode[] = [];

    // 如果是根节点，添加"全部书签"选项
    if (parentId === '0') {
      nodes.push({
        key: '',
        label: '全部书签',
        count: props.bookmarks.length,
        isFolder: false,
        children: [],
        index: -1 // 全部书签不参与排序
      });
    }

    // 查找当前层级的文件夹
    const currentLevelFolders = props.bookmarkFolders.filter(folder => {
      if (parentId === '0') {
        // 根节点下的文件夹
        return !folder.parentId || folder.parentId === '0';
      } else {
        return folder.parentId === parentId;
      }
    });

    // 按index排序（如果有的话）
    currentLevelFolders.sort((a, b) => {
      const indexA = typeof a.index === 'number' ? a.index : 999999;
      const indexB = typeof b.index === 'number' ? b.index : 999999;
      return indexA - indexB;
    });

    // 为每个文件夹创建节点
    currentLevelFolders.forEach((folder, index) => {
      if (!folder.title || folder.title.trim() === '') return;

      const children = buildTree(folder.id);
      const count = getBookmarkCount(folder.id);

      nodes.push({
        key: folder.id,
        label: folder.title,
        count,
        isFolder: true,
        parentId: folder.parentId,
        index: folder.index ?? index,
        children: children.length > 0 ? children : undefined
      });
    });

    return nodes;
  };

  return buildTree();
});

// 拖拽放置检查
const allowDrop = (info: any) => {
  const { dropNode, dragNode, dropPosition } = info;

  // 安全检查：确保节点存在
  if (!dragNode || !dropNode) {
    console.warn('allowDrop: dragNode 或 dropNode 为空', { dragNode, dropNode });
    return false;
  }

  // 确保节点有 key 属性
  if (typeof dragNode.key === 'undefined' || typeof dropNode.key === 'undefined') {
    console.warn('allowDrop: 节点缺少 key 属性', { dragNode, dropNode });
    return false;
  }

  // 不能拖拽"全部书签"节点
  if (dragNode.key === '') return false;

  // 不能拖拽到"全部书签"节点上
  if (dropNode.key === '') return false;

  // 不能拖拽到自己身上
  if (dragNode.key === dropNode.key) return false;

  // 不能拖拽到自己的子节点上（避免循环引用）
  if (dropPosition === 'inside' && isDescendant(dropNode, dragNode)) return false;

  // 如果是放置在节点内部，确保目标节点是文件夹
  if (dropPosition === 'inside' && !dropNode.isFolder) return false;

  return true;
};

// 检查是否为后代节点
const isDescendant = (possibleDescendant: TreeNode, ancestor: TreeNode): boolean => {
  // 安全检查
  if (!possibleDescendant || !ancestor) return false;
  if (typeof possibleDescendant.key === 'undefined' || typeof ancestor.key === 'undefined') return false;
  if (!ancestor.children) return false;

  for (const child of ancestor.children) {
    if (!child || typeof child.key === 'undefined') continue;
    if (child.key === possibleDescendant.key) return true;
    if (isDescendant(possibleDescendant, child)) return true;
  }

  return false;
};

// 处理拖拽放置
const handleDrop = async (info: any) => {
  const { dragNode, dropNode, dropPosition } = info;

  try {
    // 安全检查：确保节点存在
    if (!dragNode || !dropNode) {
      console.error('handleDrop: dragNode 或 dropNode 为空', { dragNode, dropNode });
      message.error('拖拽操作失败：节点信息缺失');
      return;
    }

    // 确保节点有 key 属性
    if (typeof dragNode.key === 'undefined' || typeof dropNode.key === 'undefined') {
      console.error('handleDrop: 节点缺少 key 属性', { dragNode, dropNode });
      message.error('拖拽操作失败：节点信息不完整');
      return;
    }

    // 获取拖拽节点的信息
    const dragFolder = props.bookmarkFolders.find(f => f.id === dragNode.key);
    if (!dragFolder) {
      throw new Error('找不到要移动的文件夹');
    }

    // 确定新的父ID和索引
    let newParentId: string;
    let newIndex: number;

    if (dropPosition === 'inside') {
      // 拖拽到节点内部，成为子节点
      newParentId = dropNode.key;

      // 计算插入位置：成为第一个子节点
      const existingChildren = props.bookmarkFolders.filter(f => f.parentId === newParentId);
      newIndex = 0;

      console.log(`将文件夹 "${dragFolder.title}" 移动到 "${dropNode.label}" 内部，索引: ${newIndex}`);
    } else {
      // 拖拽到节点前面或后面，与目标节点成为兄弟节点
      const dropFolder = props.bookmarkFolders.find(f => f.id === dropNode.key);
      newParentId = dropFolder?.parentId || '1'; // 默认到书签栏

      // 获取同一父级下的所有兄弟节点，按当前索引排序
      const siblings = props.bookmarkFolders
        .filter(f => f.parentId === newParentId)
        .sort((a, b) => (a.index || 0) - (b.index || 0));

      // 找到目标节点在兄弟节点中的位置
      const targetIndex = siblings.findIndex(f => f.id === dropNode.key);

      if (dropPosition === 'before') {
        newIndex = targetIndex;
      } else { // 'after'
        newIndex = targetIndex + 1;
      }

      console.log(`将文件夹 "${dragFolder.title}" 移动到 "${dropNode.label}" ${dropPosition === 'before' ? '前面' : '后面'}，父级: ${newParentId}，索引: ${newIndex}`);
    }

    // 检查是否实际需要移动
    if (dragFolder.parentId === newParentId && dragFolder.index === newIndex) {
      console.log('文件夹位置未发生变化，跳过移动操作');
      return;
    }

    // 调用书签服务移动文件夹
    await bookmarkService.moveBookmark(dragNode.key, {
      parentId: newParentId,
      index: newIndex
    });

    message.success(`文件夹 "${dragFolder.title}" 移动成功！`);

    // 通知父组件重新加载数据
    emit('reorder');

  } catch (error) {
    console.error('移动文件夹失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error(`移动文件夹失败：${errorMessage}`);
  }
};

// 渲染前缀图标
const renderPrefix = ({ option }: any) => {
  const node = option as TreeNode;
  if (!node.isFolder) {
    return h(NIcon, {
      size: 16,
      class: 'tree-icon all-bookmarks-icon',
      style: {
        color: 'var(--n-text-color-2)'
      }
    }, { default: () => h(BookmarksOutline) });
  }

  const isExpanded = expandedKeys.value.includes(node.key);
  const icon = isExpanded ? FolderOpenOutline : FolderOutline;

  return h(NIcon, {
    size: 16,
    class: `tree-icon folder-icon ${isExpanded ? 'expanded' : 'collapsed'}`,
    style: {
      color: isExpanded ? 'var(--n-warning-color)' : 'var(--n-text-color-2)'
    }
  }, { default: () => h(icon) });
};

// 渲染标签
const renderLabel = ({ option }: any) => {
  const node = option as TreeNode;
  return h(
    'span',
    {
      class: `tree-label ${node.isFolder ? 'folder-label' : 'all-bookmarks-label'}`,
      style: {
        fontSize: '14px',
        fontWeight: node.isFolder ? '500' : '600'
      }
    },
    node.label
  );
};

// 渲染后缀（书签数量）
const renderSuffix = ({ option }: any) => {
  const node = option as TreeNode;
  if (typeof node.count === 'number') {
    return h(
      NText,
      {
        depth: 3,
        class: 'tree-count text-xs font-medium'
      },
      { default: () => `(${node.count})` }
    );
  }
  return null;
};

// 处理选择
const handleSelect = (keys: string[]) => {
  const key = keys[0] || '';
  selectedKeys.value = keys;
  emit('select', key);
};

// 处理展开/折叠
const handleExpand = (keys: string[]) => {
  expandedKeys.value = keys;
};

// 监听选中文件夹的变化
watch(() => props.selectedFolder, (newValue) => {
  selectedKeys.value = newValue ? [newValue] : [];
}, { immediate: true });

// 监听文件夹数据变化，自动展开有子项的节点
watch(() => props.bookmarkFolders, () => {
  // 自动展开根节点和有子项的节点
  const expandKeys = ['0'];

  // 找出所有有子项的文件夹
  const foldersWithChildren = props.bookmarkFolders.filter(folder => {
    return props.bookmarkFolders.some(child => child.parentId === folder.id);
  });

  foldersWithChildren.forEach(folder => {
    if (!expandKeys.includes(folder.id)) {
      expandKeys.push(folder.id);
    }
  });

  expandedKeys.value = expandKeys;
}, { immediate: true });
</script>

