<template>
  <div class="tree-node-item">
    <div
      class="tree-item folder-item"
      :class="{ selected: selectedFolder === folder.id }"
      :style="{ paddingLeft: (level * 16) + 'px' }"
      @click="$emit('select', folder.id)"
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

    <!-- 子文件夹 -->
    <VueDraggable
      v-if="folder.children && folder.children.length > 0"
      v-model="folder.children"
      group="bookmark-folders"
      :animation="200"
      ghost-class="sortable-ghost"
      chosen-class="sortable-chosen"
      drag-class="sortable-drag"
      class="children-container"
      tag="div"
    >
      <TreeNodeItem
        v-for="childFolder in folder.children"
        :key="childFolder.id"
        :folder="childFolder"
        :selected-folder="selectedFolder"
        :level="level + 1"
        @select="$emit('select', $event)"
      />
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { NIcon, NText } from 'naive-ui';
import { FolderOutline } from '@vicons/ionicons5';
import { VueDraggable } from 'vue-draggable-plus';

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
  folder: TreeNodeData;
  selectedFolder: string;
  level: number;
}

defineProps<Props>();

defineEmits<{
  select: [folderId: string];
}>();
</script>

<style scoped>
/* 嵌套节点样式 */
.tree-node-item {
  position: relative;
}

.children-container {
  position: relative;
  margin-left: 0;
}

.children-container .tree-node-item {
  position: relative;
}

/* 子级缩进样式 */
.children-container .tree-item.folder-item {
  margin-left: 16px;
  position: relative;
}

.children-container .tree-item.folder-item::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  width: 1px;
  height: 100%;
  background: var(--n-border-color);
  opacity: 0.3;
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
</style>