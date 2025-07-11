<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>{{ isEditing ? '编辑书签' : '添加书签' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '编辑书签信息' : '创建一个新的书签，填写相关信息。' }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto">
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <label for="title" class="text-sm font-medium">
              标题 <span class="text-destructive">*</span>
            </label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="书签标题"
              class="w-full"
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
              class="w-full"
            />
          </div>

          <div class="grid gap-2">
            <label for="description" class="text-sm font-medium">描述</label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="书签描述（可选）"
              rows="2"
              class="w-full resize-none"
            />
          </div>

          <div class="grid gap-2">
            <label for="category" class="text-sm font-medium">分类</label>
            <Select v-model="formData.category">
              <SelectTrigger class="w-full">
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
              <SelectTrigger class="w-full">
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
      </div>

      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button @click="handleConfirm" :disabled="!formData.title || !formData.url">
          {{ isEditing ? '保存' : '添加书签' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, withDefaults } from 'vue';
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
import Select from '@/components/ui/select/Select.vue';
import SelectContent from '@/components/ui/select/SelectContent.vue';
import SelectItem from '@/components/ui/select/SelectItem.vue';
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue';
import SelectValue from '@/components/ui/select/SelectValue.vue';

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
  editingBookmark?: BookmarkForm | null;
}

const props = withDefaults(defineProps<Props>(), {
  editingBookmark: null
});

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

const isEditing = computed(() => !!props.editingBookmark);

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

// 初始化表单数据
const initFormData = () => {
  if (props.editingBookmark) {
    formData.value = { ...props.editingBookmark };
  } else {
    resetForm();
  }
};

// 监听显示状态和编辑数据
watch(() => props.show, (newShow) => {
  if (newShow) {
    initFormData();
  }
});

watch(() => props.editingBookmark, () => {
  if (props.show) {
    initFormData();
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