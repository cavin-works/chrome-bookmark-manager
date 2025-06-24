<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          设置
        </DialogTitle>
        <DialogDescription>
          自定义您的书签管理体验。
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- 外观设置 -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-foreground">外观</h4>
          <div class="grid gap-4">
            <div class="flex items-center justify-between">
              <label for="theme" class="text-sm font-medium">主题</label>
              <Select v-model="formData.theme">
                <SelectTrigger class="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in themeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex items-center justify-between">
              <label for="layout" class="text-sm font-medium">默认布局</label>
              <Select v-model="formData.layout">
                <SelectTrigger class="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in layoutOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <!-- 显示设置 -->
        <Separator />
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-foreground">显示选项</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label for="show-tags" class="text-sm font-medium">显示标签</label>
              <Switch id="show-tags" v-model:checked="formData.showTags" />
            </div>

            <div class="flex items-center justify-between">
              <label for="show-desc" class="text-sm font-medium">显示描述</label>
              <Switch id="show-desc" v-model:checked="formData.showDescriptions" />
            </div>

            <div class="flex items-center justify-between">
              <label for="auto-categorize" class="text-sm font-medium">自动分类</label>
              <Switch id="auto-categorize" v-model:checked="formData.autoCategorize" />
            </div>
          </div>
        </div>

        <!-- AI 设置 -->
        <Separator />
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-foreground">AI 功能</h4>
          <div class="grid gap-2">
            <label for="api-key" class="text-sm font-medium">OpenAI API 密钥</label>
            <Input
              id="api-key"
              v-model="formData.aiApiKey"
              type="password"
              placeholder="sk-..."
              class="font-mono text-xs"
            />
            <p class="text-xs text-muted-foreground">
              用于自动分类和智能标签功能
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button @click="handleConfirm">
          <Save class="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save } from 'lucide-vue-next';
import type { UserSettings } from '../utils/types';

interface Props {
  show: boolean;
  settings: UserSettings;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:show': [show: boolean];
  'confirm': [settings: UserSettings];
}>();

const formData = ref<UserSettings>({
  theme: 'auto',
  layout: 'grid',
  showTags: true,
  showDescriptions: true,
  autoCategorize: true,
});

// 主题选项
const themeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
];

// 布局选项
const layoutOptions = [
  { label: '网格', value: 'grid' },
  { label: '列表', value: 'list' }
];

// 监听显示状态，同步设置数据
watch(() => props.show, (newShow) => {
  if (newShow) {
    formData.value = { ...props.settings };
  }
});

// 监听settings变化
watch(() => props.settings, (newSettings) => {
  formData.value = { ...newSettings };
}, { deep: true });

const handleCancel = () => {
  emit('update:show', false);
  // 恢复原始设置
  formData.value = { ...props.settings };
};

const handleConfirm = () => {
  emit('confirm', { ...formData.value });
  emit('update:show', false);
};
</script>