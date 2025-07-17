<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="flex items-center">
          <Bot class="w-5 h-5 mr-2" />
          AI 一键整理书签
        </DialogTitle>
        <DialogDescription>
          让 AI 智能分析您的书签内容，自动为其分配合适的标签，实现书签的智能分类管理
          <br>
          <span class="text-sm text-muted-foreground">
            待整理无标签书签: {{ (bookmarks || []).filter(b => !b.tags || b.tags.length === 0).length }} 个
          </span>
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4">
          <!-- 处理状态显示 -->
          <div v-if="isProcessing" class="space-y-4">
            <div class="flex items-center justify-center py-8">
              <div class="flex flex-col items-center space-y-4">
                <div class="relative">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Bot class="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div class="text-center">
                  <p class="text-lg font-medium">AI 正在分析书签并分配标签...</p>
                  <p class="text-sm text-muted-foreground mt-1">
                    已处理 {{ progress.processed }} / {{ progress.total }} 个书签
                  </p>
                </div>
                <div class="w-full max-w-md">
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary transition-all duration-300"
                      :style="{ width: `${progress.percentage}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 预览结果 -->
          <div v-else-if="(results || []).length > 0" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">整理预览</h3>
              <div class="flex items-center space-x-2">
                <Button
                  @click="regenerate"
                  variant="outline"
                  size="sm"
                  :disabled="isProcessing"
                >
                  <RefreshCw class="w-3 h-3 mr-1" />
                  重新整理
                </Button>
              </div>
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div 
                v-for="(result, index) in results" 
                :key="index"
                class="p-3 border rounded-lg"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <Globe class="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span class="font-medium text-sm truncate">{{ result.bookmark.title || result.bookmark.url }}</span>
                    </div>
                    <p class="text-sm text-muted-foreground mt-1 truncate">{{ result.bookmark.url }}</p>
                  </div>
                  <div class="flex flex-wrap gap-1 ml-2">
                    <span
                      v-for="tag in result.suggestedTags"
                      :key="tag"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-3 bg-blue-50 rounded-lg">
              <h4 class="text-sm font-medium text-blue-900 mb-2">整理统计</h4>
              <div class="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div>已整理书签: <span class="font-semibold">{{ (results || []).length }}</span></div>
                <div>新增标签: <span class="font-semibold">{{ newTagsCount }}</span></div>
                <div>使用现有标签: <span class="font-semibold">{{ existingTagsCount }}</span></div>
                <div>平均标签数: <span class="font-semibold">{{ averageTagsPerBookmark.toFixed(1) }}</span></div>
              </div>
            </div>
          </div>

          <!-- 配置错误状态 -->
          <div v-else-if="configError" class="text-center py-8">
            <div class="max-w-md mx-auto">
              <AlertTriangle class="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">AI 配置不完整</h3>
              <p class="text-gray-500 mb-4">
                {{ configError }}
              </p>
              <div class="space-y-2">
                <Button @click="router.push('/settings')" variant="outline" class="w-full">
                  <Settings class="w-4 h-4 mr-2" />
                  前往设置页面
                </Button>
                <Button @click="retry" variant="ghost" size="sm">
                  重新检查配置
                </Button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-8">
            <Bot class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">开始整理书签</h3>
            <p class="text-gray-500 mb-4">
              AI 将分析每个书签的内容，并为其分配合适的标签
            </p>
            <div class="space-y-2">
              <Button @click="startOrganization" :disabled="(bookmarks || []).filter(b => !b.tags || b.tags.length === 0).length === 0">
                <Bot class="w-4 h-4 mr-2" />
                开始整理
              </Button>
              <p class="text-sm text-gray-400">
                可整理无标签书签: {{ (bookmarks || []).filter(b => !b.tags || b.tags.length === 0).length }} 个
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-2">
            <Button
              v-if="(results || []).length > 0"
              @click="startOrganization"
              variant="outline"
              :disabled="isProcessing"
            >
              <RefreshCw class="w-4 h-4 mr-2" />
              重新整理
            </Button>
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" @click="$emit('update:open', false)">
              取消
            </Button>
            <Button
              @click="confirm"
              :disabled="(results || []).length === 0 || isProcessing"
            >
              确认应用 ({{ (results || []).length }}个书签)
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, RefreshCw, AlertTriangle, Settings, Globe } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useTagOrganizer } from '@/composables/useTagOrganizer';

interface Props {
  modelValue: boolean;
  bookmarks: any[];
  existingTags: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [result: any[]];
}>();

const router = useRouter();

// 使用 tag organizer hook
const tagOrganizerHook = useTagOrganizer({
  bookmarks: props.bookmarks,
  existingTags: props.existingTags
});

const {
  isProcessing,
  progress,
  results,
  configError,
  startAIOrganize,
  retryAIOrganize
} = tagOrganizerHook;

// 计算属性
const newTagsCount = computed(() => {
  const allSuggestedTags = (results.value || []).flatMap(r => r.suggestedTags || []);
  return allSuggestedTags.filter(tag => !props.existingTags.includes(tag)).length;
});

const existingTagsCount = computed(() => {
  const allSuggestedTags = (results.value || []).flatMap(r => r.suggestedTags || []);
  return allSuggestedTags.filter(tag => props.existingTags.includes(tag)).length;
});

const averageTagsPerBookmark = computed(() => {
  if (!(results.value || []).length) return 0;
  const totalTags = (results.value || []).reduce((sum, r) => sum + (r.suggestedTags || []).length, 0);
  return totalTags / (results.value || []).length;
});

// 事件处理
const startOrganization = () => {
  startAIOrganize();
};

const regenerate = () => {
  startAIOrganize();
};

const retry = () => {
  retryAIOrganize();
};

const confirm = () => {
  emit('confirm', results.value);
};

// 监听对话框打开状态
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 重置状态
    results.value = [];
    configError.value = '';
  }
});
</script>