<template>
  <Dialog :open="modelValue" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="flex items-center">
          <Sparkles class="w-5 h-5 mr-2" />
          AI 智能生成标签
        </DialogTitle>
        <DialogDescription>
          基于您现有的书签，AI 将为您推荐合适的标签。您可以选择需要的标签并继续生成更多选项。
          <br>
          <span class="text-sm text-muted-foreground">
            当前可分析书签数量: {{ bookmarks.length }} 个
          </span>
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4 py-4">
          <!-- AI 状态显示 -->
          <div v-if="aiGenerating" class="flex items-center justify-center py-8">
            <div class="flex items-center space-x-2 text-primary">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>AI 正在分析您的书签并生成标签...</span>
            </div>
          </div>

          <!-- 推荐标签列表 -->
          <div v-else-if="recommendedTags.length > 0" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">推荐的标签 ({{ recommendedTags.length }})</h3>
              <div class="flex items-center space-x-2">
                <Button
                  @click="selectAll"
                  variant="outline"
                  size="sm"
                >
                  全选
                </Button>
                <Button
                  @click="clearAll"
                  variant="outline"
                  size="sm"
                >
                  清空
                </Button>
                <Button
                  @click="regenerate"
                  variant="outline"
                  size="sm"
                  :disabled="aiGenerating"
                >
                  <RefreshCw class="w-3 h-3 mr-1" />
                  换一批
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label
                v-for="tag in recommendedTags"
                :key="tag"
                class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{
                  'bg-primary/10 border-primary': selectedTags.includes(tag),
                  'border-gray-200': !selectedTags.includes(tag)
                }"
              >
                <input
                  type="checkbox"
                  :checked="selectedTags.includes(tag)"
                  @change="toggleTag(tag)"
                  class="rounded"
                />
                <span class="text-sm font-medium">{{ tag }}</span>
              </label>
            </div>

            <div v-if="selectedTags.length > 0" class="p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-700 mb-2">
                已选择 {{ selectedTags.length }} 个标签:
              </p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in selectedTags"
                  :key="tag"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                  <button
                    @click="removeTag(tag)"
                    class="ml-1 hover:text-blue-600"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <!-- AI 配置错误状态 -->
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
          <div v-else-if="!aiGenerating" class="text-center py-8">
            <Sparkles class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">开始生成标签</h3>
            <p class="text-gray-500 mb-2">
              点击下方按钮，AI 将分析您的书签并推荐合适的标签
            </p>
            <p class="text-sm text-muted-foreground">
              可分析书签数量: {{ bookmarks.length }} 个
              {{ bookmarks.length === 0 ? '（暂无书签数据）' : '' }}
            </p>
          </div>
        </div>
      </div>

      <DialogFooter class="flex-shrink-0">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-2">
            <Button
              @click="generate"
              variant="outline"
              :disabled="aiGenerating || bookmarks.length === 0"
            >
              <Sparkles class="w-4 h-4 mr-2" />
              {{ recommendedTags.length > 0 ? '重新生成' : '开始生成' }}
            </Button>
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" @click="$emit('update:open', false)">
              取消
            </Button>
            <Button
              @click="confirm"
              :disabled="selectedTags.length === 0"
            >
              创建选中标签 ({{ selectedTags.length }})
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
import { Sparkles, RefreshCw, AlertTriangle, Settings, X } from 'lucide-vue-next';
import { useAITags } from '@/composables/useAITags';
import { useRouter } from 'vue-router';

interface Props {
  modelValue: boolean;
  bookmarks: any[];
  existingTags: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [tags: string[]];
}>()

const router = useRouter();

// 使用 AI tags hook
const aiTagsHook = useAITags({
  bookmarks: props.bookmarks,
  existingTags: props.existingTags
});

const {
  aiGenerating,
  recommendedTags,
  selectedRecommendedTags: selectedTags,
  aiConfigError: configError,
  generateAITags,
  toggleTagSelection,
  selectAllRecommendedTags,
  clearAllRecommendedTags,
  removeSelectedTag
} = aiTagsHook;

// 事件处理
const generate = () => {
  generateAITags();
};

const regenerate = () => {
  generateAITags();
};

const retry = () => {
  configError.value = '';
  generateAITags();
};

const toggleTag = (tag: string) => {
  toggleTagSelection(tag);
};

const selectAll = () => {
  selectAllRecommendedTags();
};

const clearAll = () => {
  clearAllRecommendedTags();
};

const removeTag = (tag: string) => {
  removeSelectedTag(tag);
};

const confirm = () => {
  emit('confirm', selectedTags.value);
};

// 监听对话框打开状态
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedTags.value = [];
    recommendedTags.value = [];
    configError.value = '';
  }
});
</script>