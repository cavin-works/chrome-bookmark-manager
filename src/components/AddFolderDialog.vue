<template>
  <n-modal :show="show" preset="dialog" title="创建文件夹" @update:show="$emit('update:show', $event)">
    <n-form ref="formRef" :model="formData" label-placement="top">
      <n-form-item label="文件夹名称" path="title" required>
        <n-input v-model:value="formData.title" placeholder="文件夹名称" />
      </n-form-item>
      <n-form-item label="父文件夹" path="parentId">
        <n-select
          v-model:value="formData.parentId"
          :options="folderOptions"
          placeholder="根目录"
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
          :disabled="!formData.title"
        >
          创建
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace } from 'naive-ui';

interface FolderForm {
  title: string;
  parentId: string;
}

interface Props {
  show: boolean;
  folderOptions: Array<{ label: string; value: string }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:show': [show: boolean];
  'confirm': [data: FolderForm];
}>();

const formRef = ref();
const formData = ref<FolderForm>({
  title: '',
  parentId: '',
});

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
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