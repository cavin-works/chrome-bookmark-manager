<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="flex items-center">
          <AlertTriangle class="w-5 h-5 mr-2 text-orange-500" />
          标签去重确认
        </DialogTitle>
        <DialogDescription>
          系统将自动检测并合并重复的标签，确保标签的唯一性和规范性
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">去重规则说明</h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li>• 合并名称相同或相似度高的标签</li>
              <li>• 保留使用次数最多的标签作为标准标签</li>
              <li>• 自动更新所有相关书签的标签引用</li>
              <li>• 删除重复标签（不会删除书签）</li>
            </ul>
          </div>

          <div class="p-4 bg-yellow-50 rounded-lg">
            <h4 class="text-sm font-medium text-yellow-900 mb-2">注意事项</h4>
            <ul class="text-sm text-yellow-700 space-y-1">
              <li>• 此操作无法撤销，请谨慎操作</li>
              <li>• 建议在操作前先备份重要数据</li>
              <li>• 去重过程可能需要一些时间</li>
            </ul>
          </div>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <div class="flex items-center justify-between w-full">
          <Button variant="outline" @click="$emit('update:open', false)">
            取消
          </Button>
          <Button @click="confirm" variant="destructive">
            确认去重
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-vue-next';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [];
}>();

const confirm = () => {
  emit('confirm');
};
</script>