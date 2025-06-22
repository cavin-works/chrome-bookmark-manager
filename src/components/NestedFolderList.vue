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

<style scoped>
.nested-container {
  min-height: 20px;
}

.nested-folder-item {
  position: relative;
}

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

.tree-item-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  height: 100%;
  box-sizing: border-box;
}

.tree-icon {
  font-size: 14px;
  margin-right: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  opacity: 0.8;
}

.tree-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-count {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.6;
  margin-left: 4px;
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

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .sortable-drag {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}
</style>