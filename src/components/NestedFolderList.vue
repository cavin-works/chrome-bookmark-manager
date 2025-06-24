<template>
  <VueDraggable
    v-model="folderList"
    group="bookmark-folders"
    :animation="200"
    ghost-class="sortable-ghost"
    chosen-class="sortable-chosen"
    drag-class="sortable-drag"
    @end="onDragEnd"
    class="nested-container"
    tag="div"
  >
    <div
      v-for="folder in folderList"
      :key="folder.id"
      class="nested-folder-item"
      :data-folder-id="folder.id"
    >
      <!-- 文件夹节点 -->
      <div
        class="tree-item folder-item"
        :class="{
          selected: selectedFolder === folder.id
        }"
        :style="{ paddingLeft: `${folder.level * 16}px` }"
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

      <!-- 递归渲染子文件夹 - 关键修复：正确的递归结构 -->
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
import { computed, defineOptions } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { NIcon, NText } from '../utils/naive-ui';
import { FolderOutline } from '@vicons/ionicons5';
import { message } from '../utils/naive-ui';
import { bookmarkService } from '../services/bookmarkService';

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

