<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>添加书签</DialogTitle>
        <DialogDescription>
          创建一个新的书签，填写相关信息。
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label for="title" class="text-sm font-medium">
            标题 <span class="text-destructive">*</span>
          </label>
          <Input
            id="title"
            v-model="formData.title"
            placeholder="书签标题"
          />
        </div>

        <div class="grid gap-2">
          <label for="url" class="text-sm font-medium">
            URL <span class="text-destructive">*</span>
          </label>
          <Input
            id="url"
            v-model="formData.url"
            placeholder="https://example.com"
            type="url"
          />
        </div>

        <div class="grid gap-2">
          <label for="description" class="text-sm font-medium">描述</label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="书签描述（可选）"
            rows="3"
          />
        </div>

        <div class="grid gap-2">
          <label for="category" class="text-sm font-medium">分类</label>
          <Select v-model="formData.category">
            <SelectTrigger>
              <SelectValue placeholder="自动分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <label for="folder" class="text-sm font-medium">文件夹</label>
          <Select v-model="formData.parentId">
            <SelectTrigger>
              <SelectValue placeholder="默认位置" />
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
        <Button @click="handleConfirm" :disabled="!formData.title || !formData.url">
          添加书签
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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