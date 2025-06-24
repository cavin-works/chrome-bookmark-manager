<template>
  <VueDraggable
    v-model="folderList"
    group="bookmark-folders"
    :animation="200"
    ghost-class="opacity-50"
    chosen-class="bg-accent/50"
    drag-class="rotate-1 scale-105"
    @end="onDragEnd"
    tag="div"
    class="space-y-0.5"
  >
    <div
      v-for="folder in folderList"
      :key="folder.id"
      class="w-full"
      :data-folder-id="folder.id"
    >
      <!-- 文件夹节点 -->
      <div
        :class="cn(
          'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          selectedFolder === folder.id && 'bg-accent text-accent-foreground font-medium'
        )"
        :style="{ paddingLeft: `${folder.level * 16 + 8}px` }"
        @click="handleSelect(folder.id)"
      >
        <Folder class="h-4 w-4 text-muted-foreground" />
        <span class="flex-1 truncate text-sm">{{ folder.title }}</span>
        <Badge v-if="folder.count > 0" variant="secondary" class="h-5 text-xs">
          {{ folder.count }}
        </Badge>
      </div>

      <!-- 递归渲染子文件夹 -->
      <NestedFolderList
        v-if="folder.children && folder.children.length > 0"
        v-model="folder.children"
        :selected-folder="selectedFolder"
        @select="$emit('select', $event)"
        @reorder="$emit('reorder')"
      />
    </div>
  </VueDraggable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-vue-next';

// 设置组件名称，用于递归 - 关键：必须与组件名一致
defineOptions({
  name: 'NestedFolderList'
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
  modelValue: TreeNodeData[];
  selectedFolder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedFolder: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: TreeNodeData[]];
  select: [folderId: string];
  reorder: [];
}>();

// 双向绑定的文件夹列表 - 关键：正确的双向绑定
const folderList = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 处理选择
const handleSelect = (folderId: string) => {
  emit('select', folderId);
};

// 简化的拖拽结束处理 - 避免复杂的同步逻辑
const onDragEnd = async (evt: any) => {
  const { oldIndex, newIndex } = evt;

  if (oldIndex === newIndex) {
    return;
  }

  console.log('拖拽完成，等待数据自动更新');

  // vue-draggable-plus 会自动更新 modelValue
  // 我们只需要延迟通知父组件刷新即可
  setTimeout(() => {
    console.log('通知父组件刷新数据');
    emit('reorder');
  }, 500); // 增加延迟时间，确保拖拽动画完成
};
</script>

