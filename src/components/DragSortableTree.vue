<template>
  <div class="w-full space-y-2">
    <!-- 使用提示 -->
    <div v-if="!hideAllBookmarks && nestedTreeData.length > 0" class="px-2">
      <div class="rounded-md bg-muted/50 p-2">
        <p class="text-xs text-muted-foreground">
          💡 提示：拖拽文件夹进行排序，支持精确位置插入。智能防护确保不会移动到错误位置。
        </p>
      </div>
    </div>

    <div class="space-y-1">
      <!-- 全部书签 -->
      <div v-if="!hideAllBookmarks" class="px-2">
        <Button
          variant="ghost"
          :class="cn(
            'h-auto w-full justify-start p-2',
            selectedFolder === '' && 'bg-accent text-accent-foreground font-medium'
          )"
          @click="handleSelect('')"
        >
          <BookmarkIcon class="mr-2 h-4 w-4" />
          <span class="flex-1 text-left">全部书签</span>
          <Badge variant="secondary" class="ml-auto">{{ totalBookmarks }}</Badge>
        </Button>
      </div>

      <!-- 原生拖拽实现的文件夹树 -->
      <div class="space-y-0.5 px-2">
        <TreeNodeItemNative
          v-for="folder in nestedTreeData"
          :key="folder.id"
          :folder="folder"
          :selected-folder="selectedFolder"
          :level="0"
          :all-folders="bookmarkFolders"
          @select="handleTreeSelect"
          @move="handleFolderMove"
          @reorder="handleReorder"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast/use-toast';
import { Bookmark as BookmarkIcon } from 'lucide-vue-next';
import type { Bookmark as BookmarkType, BookmarkFolder } from '../utils/types';
import { bookmarkService } from '../services/bookmarkService';
import TreeNodeItemNative from './TreeNodeItemNative.vue';

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
  bookmarks: BookmarkType[];
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

const { toast } = useToast();

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

// 处理文件夹移动（新的原生拖拽方式）
const handleFolderMove = async (moveData: {
  sourceId: string;
  targetId: string;
  position: 'before' | 'after' | 'inside';
  sourceIndex: number;
  targetIndex: number;
}) => {
  console.log('=== 开始原生拖拽移动 ===');
  console.log('移动数据:', moveData);

  try {
    const { sourceId, targetId, position } = moveData;

    // 检查是否试图将文件夹移动到其子文件夹中
    const isMovingToChild = await checkIfMovingToChild(sourceId, targetId);
    if (isMovingToChild) {
      toast({
        title: "移动失败",
        description: "不能将文件夹移动到自己的子文件夹中",
        variant: "destructive",
      });
      return;
    }

    let newParentId = '';
    let newIndex = 0;

    if (position === 'inside') {
      // 移动到文件夹内部
      newParentId = targetId;
      newIndex = 0;
    } else {
      // 移动到文件夹的前面或后面（同级操作）
      const targetFolder = props.bookmarkFolders.find(f => f.id === targetId);
      if (!targetFolder) {
        throw new Error('找不到目标文件夹');
      }

      newParentId = targetFolder.parentId || '1';

      // 计算新的索引位置
      const siblings = props.bookmarkFolders.filter(f => f.parentId === newParentId);
      const targetSiblingIndex = siblings.findIndex(f => f.id === targetId);

      if (position === 'before') {
        newIndex = targetSiblingIndex;
      } else {
        newIndex = targetSiblingIndex + 1;
      }

      // 如果源文件夹在同一父文件夹中且在目标之前，需要调整索引
      const sourceFolder = props.bookmarkFolders.find(f => f.id === sourceId);
      if (sourceFolder && sourceFolder.parentId === newParentId) {
        const sourceSiblingIndex = siblings.findIndex(f => f.id === sourceId);
        if (sourceSiblingIndex < targetSiblingIndex) {
          newIndex--;
        }
      }
    }

    // 调用Chrome书签API移动文件夹
    const result = await bookmarkService.moveBookmark(sourceId, {
      parentId: newParentId,
      index: newIndex
    });

    console.log('Chrome API 移动结果:', result);

    // 统计移动的项目
    const totalItems = await countTotalItemsInFolder(sourceId);
    const sourceFolder = props.bookmarkFolders.find(f => f.id === sourceId);

    toast({
      title: "移动成功",
      description: `成功移动文件夹 "${sourceFolder?.title}" 及其 ${totalItems.folders} 个子文件夹和 ${totalItems.bookmarks} 个书签！`,
    });

    console.log('=== 原生拖拽移动完成 ===');

  } catch (error) {
    console.error('=== 原生拖拽移动失败 ===');
    console.error('错误详情:', error);

    if (error instanceof Error) {
      if (error.message.includes('descendant')) {
        toast({
          title: "移动失败",
          description: "不能将文件夹移动到自己的子文件夹中",
          variant: "destructive",
        });
      } else {
        toast({
          title: "移动失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "移动失败",
        description: "移动书签失败，请重试",
        variant: "destructive",
      });
    }
  }

  // 延迟刷新数据以确保同步完成
  setTimeout(() => {
    console.log('触发数据重新加载');
    emit('reorder');
  }, 300);
};

// 检查是否试图移动到子文件夹
const checkIfMovingToChild = async (sourceId: string, targetId: string): Promise<boolean> => {
  // 递归检查目标文件夹是否是源文件夹的后代
  const checkDescendant = (folderId: string): boolean => {
    if (folderId === sourceId) {
      return true;
    }

    const childFolders = props.bookmarkFolders.filter(f => f.parentId === folderId);
    for (const child of childFolders) {
      if (checkDescendant(child.id)) {
        return true;
      }
    }

    return false;
  };

  return checkDescendant(targetId);
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

