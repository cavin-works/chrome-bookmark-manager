<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <FolderPlus class="h-5 w-5" />
          创建文件夹
        </DialogTitle>
        <DialogDescription>
          创建一个新的文件夹来组织您的书签。
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label for="title" class="text-sm font-medium">
            文件夹名称 <span class="text-destructive">*</span>
          </label>
          <Input
            id="title"
            v-model="formData.title"
            placeholder="文件夹名称"
          />
        </div>

        <div class="grid gap-2">
          <label for="parent" class="text-sm font-medium">父文件夹</label>
          <Select v-model="formData.parentId">
            <SelectTrigger>
              <SelectValue placeholder="根目录" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in folderOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button @click="handleConfirm" :disabled="!formData.title">
          <FolderPlus class="mr-2 h-4 w-4" />
          创建文件夹
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus } from 'lucide-vue-next';

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