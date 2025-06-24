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

