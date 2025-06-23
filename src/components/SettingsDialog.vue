<template>
  <n-modal :show="show" preset="dialog" title="设置" @update:show="$emit('update:show', $event)">
    <n-form :model="formData" label-placement="left" label-width="100">
      <n-form-item label="主题">
        <n-select v-model:value="formData.theme" :options="themeOptions" />
      </n-form-item>
      <n-form-item label="布局">
        <n-select v-model:value="formData.layout" :options="layoutOptions" />
      </n-form-item>
      <n-form-item label="显示标签">
        <n-switch v-model:value="formData.showTags" />
      </n-form-item>
      <n-form-item label="显示描述">
        <n-switch v-model:value="formData.showDescriptions" />
      </n-form-item>
      <n-form-item label="自动分类">
        <n-switch v-model:value="formData.autoCategorize" />
      </n-form-item>
      <n-form-item label="OpenAI API密钥">
        <n-input
          v-model:value="formData.aiApiKey"
          type="password"
          placeholder="sk-..."
          show-password-on="click"
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NSelect, NSwitch, NInput, NButton, NSpace } from 'naive-ui';
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