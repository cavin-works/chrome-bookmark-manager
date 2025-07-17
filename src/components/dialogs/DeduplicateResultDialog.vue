<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="flex items-center">
          <CheckCircle class="w-5 h-5 mr-2 text-green-500" />
          标签去重完成
        </DialogTitle>
        <DialogDescription>
          已成功完成标签去重操作，以下是详细的处理结果
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4">
          <!-- 处理结果统计 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-green-50 rounded-lg text-center">
              <div class="text-2xl font-bold text-green-600">{{ result.removedTags }}</div>
              <div class="text-sm text-green-700">已删除标签</div>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg text-center">
              <div class="text-2xl font-bold text-blue-600">{{ result.mergedTags }}</div>
              <div class="text-sm text-blue-700">合并标签</div>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg text-center">
              <div class="text-2xl font-bold text-purple-600">{{ result.updatedBookmarks }}</div>
              <div class="text-sm text-purple-700">更新书签</div>
            </div>
            <div class="p-4 bg-orange-50 rounded-lg text-center">
              <div class="text-2xl font-bold text-orange-600">{{ result.remainingTags }}</div>
              <div class="text-sm text-orange-700">剩余标签</div>
            </div>
          </div>

          <!-- 详细信息 -->
          <div v-if="result.details && result.details.length > 0" class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-900">详细处理记录</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="(detail, index) in result.details" 
                :key="index"
                class="p-3 border rounded-lg text-sm"
              >
                <div class="flex items-center space-x-2 mb-1">
                  <Tag class="w-4 h-4 text-gray-400" />
                  <span class="font-medium">{{ detail.from }}</span>
                  <ArrowRight class="w-3 h-3 text-gray-400" />
                  <span class="font-medium text-primary">{{ detail.to }}</span>
                </div>
                <div class="text-xs text-gray-600">
                  影响了 {{ detail.affectedBookmarks }} 个书签
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-8">
            <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-gray-900 mb-2">太棒了！</h4>
            <p class="text-gray-500">
              没有检测到重复标签，您的标签管理已经很规范了
            </p>
          </div>

          <!-- 操作建议 -->
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">优化建议</h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li>• 定期检查和整理标签，保持标签的规范性</li>
              <li>• 使用 AI 生成标签功能，获取更合适的标签建议</li>
              <li>• 为书签设置统一的标签命名规范</li>
            </ul>
          </div>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <Button @click="close" class="w-full">
          完成
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Tag, ArrowRight } from 'lucide-vue-next';

interface DedupDetail {
  from: string;
  to: string;
  affectedBookmarks: number;
}

interface DedupResult {
  removedTags: number;
  mergedTags: number;
  updatedBookmarks: number;
  remainingTags: number;
  details?: DedupDetail[];
}

interface Props {
  modelValue: boolean;
  result: DedupResult;
}

const props = withDefaults(defineProps<Props>(), {
  result: () => ({
    removedTags: 0,
    mergedTags: 0,
    updatedBookmarks: 0,
    remainingTags: 0,
    details: []
  })
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  'close': [];
}>();

const close = () => {
  emit('close');
  emit('update:open', false);
};
</script>