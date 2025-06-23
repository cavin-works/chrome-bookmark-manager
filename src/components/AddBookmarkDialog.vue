<template>
  <n-modal :show="show" preset="dialog" title="添加书签" @update:show="$emit('update:show', $event)">
    <n-form ref="formRef" :model="formData" label-placement="top">
      <n-form-item label="标题" path="title" required>
        <n-input v-model:value="formData.title" placeholder="书签标题" />
      </n-form-item>
      <n-form-item label="URL" path="url" required>
        <n-input v-model:value="formData.url" placeholder="https://example.com" />
      </n-form-item>
      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="书签描述（可选）"
        />
      </n-form-item>
      <n-form-item label="分类" path="category">
        <n-select
          v-model:value="formData.category"
          :options="categoryOptions"
          placeholder="自动分类"
          clearable
        />
      </n-form-item>
      <n-form-item label="文件夹" path="parentId">
        <n-select
          v-model:value="formData.parentId"
          :options="folderOptions"
          placeholder="默认位置"
          clearable
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space>
        <n-button @click="handleCancel">取消</n-button>
        <n-button
          type="primary"
          @click="handleConfirm"
          :disabled="!formData.title || !formData.url"
        >
          添加
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace } from 'naive-ui';

interface BookmarkForm {
  title: string;
  url: string;
  description: string;
  category: string;
  parentId: string;
}

interface Props {
  show: boolean;
  categoryOptions: Array<{ label: string; value: string }>;
  folderOptions: Array<{ label: string; value: string }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:show': [show: boolean];
  'confirm': [data: BookmarkForm];
}>();

const formRef = ref();
const formData = ref<BookmarkForm>({
  title: '',
  url: '',
  description: '',
  category: '',
  parentId: '',
});

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    url: '',
    description: '',
    category: '',
    parentId: '',
  };
};

// 监听显示状态，重置表单
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm();
  }
});

const handleCancel = () => {
  emit('update:show', false);
  resetForm();
};

const handleConfirm = () => {
  emit('confirm', { ...formData.value });
  emit('update:show', false);
  resetForm();
};
</script>