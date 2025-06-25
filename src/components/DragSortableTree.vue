<template>
  <div class="w-full space-y-2">
    <!-- 使用提示 -->
    <div v-if="!hideAllBookmarks && nestedTreeData.length > 0" class="px-2">
      <div class="rounded-md bg-muted/50 p-2">
        <p class="text-xs text-muted-foreground">
          💡 提示：拖拽文件夹进行排序，Chrome会自动移动其所有子内容。智能防护确保不会移动到错误位置。
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

      <!-- 嵌套的可拖拽文件夹列表 -->
      <VueDraggable
        v-model="nestedTreeData"
        group="bookmark-folders"
        :animation="200"
        ghost-class="opacity-50"
        chosen-class="bg-accent/50"
        drag-class="drag-active"
        @end="onRootDragEnd"
        tag="div"
        class="space-y-0.5 min-h-[20px]"
      >
        <TreeNodeItem
          v-for="folder in nestedTreeData"
          :key="folder.id"
          :folder="folder"
          :selected-folder="selectedFolder"
          :level="0"
          @select="handleTreeSelect"
          @drag-end="onChildDragEnd"
        />
      </VueDraggable>
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

// 处理根级拖拽结束
const onRootDragEnd = async (event: any) => {
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
      toast({
        title: "错误",
        description: "找不到被拖拽的文件夹",
        variant: "destructive",
      });
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
    toast({
      title: "移动成功",
      description: `成功移动文件夹 "${draggedFolder.title}" 及其 ${totalItems.folders} 个子文件夹和 ${totalItems.bookmarks} 个书签！`,
    });

  } catch (error) {
    console.error('=== 嵌套拖拽同步失败 ===');
    console.error('错误详情:', error);

    // 恢复UI状态
    buildNestedTree();

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

// 递归处理选择事件
const handleTreeSelect = (folderId: string) => {
  emit('select', folderId);
};

// 处理子节点拖拽结束
const onChildDragEnd = async (event: any) => {
  console.log('子节点拖拽事件:', event);

  const { oldIndex, newIndex, parentId, level } = event;

  if (oldIndex === newIndex) {
    console.log('位置未改变，跳过同步');
    return;
  }

  try {
    // 找到拖拽的文件夹和目标父文件夹
    const findFolderInTree = (tree: TreeNodeData[], folderId: string): TreeNodeData | null => {
      for (const folder of tree) {
        if (folder.id === folderId) return folder;
        if (folder.children) {
          const found = findFolderInTree(folder.children, folderId);
          if (found) return found;
        }
      }
      return null;
    };

    const parentFolder = findFolderInTree(nestedTreeData.value, parentId);
    if (!parentFolder || !parentFolder.children) {
      console.error('找不到父文件夹');
      return;
    }

    const draggedFolder = parentFolder.children[oldIndex];
    if (!draggedFolder) {
      console.error('找不到被拖拽的文件夹');
      return;
    }

    console.log('子节点拖拽:', {
      draggedFolder: draggedFolder.title,
      parent: parentFolder.title,
      oldIndex,
      newIndex
    });

    // 调用Chrome API移动
    await bookmarkService.moveBookmark(draggedFolder.id, {
      parentId: parentId,
      index: newIndex
    });

    const totalItems = await countTotalItemsInFolder(draggedFolder.id);
    toast({
      title: "移动成功",
      description: `成功移动文件夹 "${draggedFolder.title}" 及其 ${totalItems.folders} 个子文件夹和 ${totalItems.bookmarks} 个书签！`,
    });

  } catch (error) {
    console.error('子节点拖拽同步失败:', error);

    // 恢复UI状态
    buildNestedTree();

    toast({
      title: "移动失败",
      description: "移动文件夹失败，请重试",
      variant: "destructive",
    });
  }

  // 延迟刷新数据
  setTimeout(() => {
    emit('reorder');
  }, 300);
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

