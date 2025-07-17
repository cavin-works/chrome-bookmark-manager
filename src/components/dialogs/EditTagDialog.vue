<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>编辑标签</DialogTitle>
        <DialogDescription>
          修改标签的名称、颜色和描述
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4" v-if="tag">
          <div class="space-y-2">
            <label class="text-sm font-medium">标签名称</label>
            <Input
              v-model="editedTag.name"
              placeholder="输入标签名称"
              class="w-full"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">颜色</label>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="color in tagColors"
                :key="color"
                :class="cn(
                  'w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform',
                  editedTag.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                )"
                :style="{ backgroundColor: color }"
                @click="editedTag.color = color"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">描述</label>
            <Input
              v-model="editedTag.description"
              placeholder="标签描述"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="$emit('update:open', false)">取消</Button>
        <Button @click="confirm">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tag } from '@/services/tagStorageService';

interface Props {
  modelValue: boolean;
  tag: Tag | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [tagData: Partial<Tag>];
}>();

// 状态
const editedTag = ref<Partial<Tag>>({});

// 颜色选项
const tagColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// 监听标签变化
watch(() => props.tag, (newTag) => {
  if (newTag) {
    editedTag.value = {
      name: newTag.name,
      color: newTag.color,
      description: newTag.description
    };
  }
}, { immediate: true });

const confirm = () => {
  if (editedTag.value.name?.trim()) {
    emit('confirm', editedTag.value);
  }
};
</script>