<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>创建新标签</DialogTitle>
        <DialogDescription>
          为您的书签创建一个新的标签分类
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">标签名称</label>
            <Input
              v-model="tagName"
              placeholder="输入标签名称"
              @keyup.enter="confirm"
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
                  selectedColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                )"
                :style="{ backgroundColor: color }"
                @click="selectedColor = color"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">描述（可选）</label>
            <Input
              v-model="description"
              placeholder="标签描述"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="$emit('update:open', false)">取消</Button>
        <Button @click="confirm" :disabled="!tagName.trim()">创建</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [tagData: { name: string; color: string; description?: string }];
}>();

// 状态
const tagName = ref('');
const selectedColor = ref('#3b82f6');
const description = ref('');

// 颜色选项
const tagColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

const confirm = () => {
  if (tagName.value.trim()) {
    emit('confirm', {
      name: tagName.value.trim(),
      color: selectedColor.value,
      description: description.value.trim() || undefined
    });
    
    // 重置表单
    tagName.value = '';
    selectedColor.value = '#3b82f6';
    description.value = '';
  }
};
</script>