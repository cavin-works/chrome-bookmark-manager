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

          <div class="grid gap-2">
            <label class="text-sm font-medium">标签</label>
            <div class="space-y-3">
              <!-- 已选择的标签 -->
              <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2">
                <Badge
                  v-for="tag in selectedTags"
                  :key="tag.id"
                  variant="secondary"
                  class="text-xs flex items-center gap-1"
                  :style="{ borderColor: tag.color, backgroundColor: `${tag.color}20` }"
                >
                  {{ tag.name }}
                  <X 
                    class="w-3 h-3 cursor-pointer hover:text-destructive" 
                    @click="removeTag(tag)"
                  />
                </Badge>
              </div>
              
              <!-- 标签选择下拉 -->
              <Select v-model="selectedTagId" @update:model-value="addTag">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="选择标签..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="tag in availableTags"
                    :key="tag.id"
                    :value="tag.id"
                  >
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-3 h-3 rounded-full" 
                        :style="{ backgroundColor: tag.color }"
                      ></div>
                      {{ tag.name }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <!-- 提示信息 -->
              <p v-if="availableTags.length === 0" class="text-xs text-muted-foreground">
                暂无可用标签，请先到标签管理页面创建标签
              </p>
            </div>
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
import { ref, watch, computed, withDefaults, onMounted } from 'vue';
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
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select/Select.vue';
import SelectContent from '@/components/ui/select/SelectContent.vue';
import SelectItem from '@/components/ui/select/SelectItem.vue';
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue';
import SelectValue from '@/components/ui/select/SelectValue.vue';
import { X } from 'lucide-vue-next';
import { tagStorageService, type Tag } from '@/services/tagStorageService';

interface BookmarkForm {
  title: string;
  url: string;
  description: string;
  category: string;
  parentId: string;
  tags?: string[]; // 添加标签ID数组
}

interface Props {
  show: boolean;
  categoryOptions: Array<{ label: string; value: string }>;
  folderOptions: Array<{ label: string; value: string }>;
  editingBookmark?: BookmarkForm | null;
  bookmarkId?: string; // 用于编辑时加载现有标签
}

const props = withDefaults(defineProps<Props>(), {
  editingBookmark: null,
  bookmarkId: undefined
});

const emit = defineEmits<{
  'update:show': [show: boolean];
  'confirm': [data: BookmarkForm & { tagIds: string[] }];
}>();

const formData = ref<BookmarkForm>({
  title: '',
  url: '',
  description: '',
  category: '',
  parentId: '',
  tags: []
});

// 标签相关状态
const allTags = ref<Tag[]>([]);
const selectedTags = ref<Tag[]>([]);
const selectedTagId = ref<string>('');

const isEditing = computed(() => !!props.editingBookmark);

// 计算可用的标签（排除已选择的）
const availableTags = computed(() => {
  const selectedTagIds = selectedTags.value.map(tag => tag.id);
  return allTags.value.filter(tag => !selectedTagIds.includes(tag.id));
});

// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    url: '',
    description: '',
    category: '',
    parentId: '',
    tags: []
  };
  selectedTags.value = [];
  selectedTagId.value = '';
};

// 加载所有标签
const loadAllTags = async () => {
  try {
    allTags.value = await tagStorageService.getAllTags();
  } catch (error) {
    console.error('加载标签失败:', error);
  }
};

// 加载书签的现有标签
const loadBookmarkTags = async () => {
  if (!props.bookmarkId) return;
  
  try {
    const tags = await tagStorageService.getTagsForBookmark(props.bookmarkId);
    selectedTags.value = tags;
  } catch (error) {
    console.error('加载书签标签失败:', error);
  }
};

// 添加标签
const addTag = (tagId: any) => {
  if (!tagId) return;
  
  const tagIdStr = String(tagId);
  const tag = allTags.value.find(t => t.id === tagIdStr);
  if (tag && !selectedTags.value.some(t => t.id === tagIdStr)) {
    selectedTags.value.push(tag);
  }
  
  // 重置选择器
  selectedTagId.value = '';
};

// 移除标签
const removeTag = (tag: Tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  }
};

// 初始化表单数据
const initFormData = async () => {
  if (props.editingBookmark) {
    formData.value = { ...props.editingBookmark };
    // 加载书签的现有标签
    await loadBookmarkTags();
  } else {
    resetForm();
  }
};

// 监听显示状态和编辑数据
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await loadAllTags();
    await initFormData();
  }
});

watch(() => props.editingBookmark, async () => {
  if (props.show) {
    await initFormData();
  }
});

const handleCancel = () => {
  emit('update:show', false);
  resetForm();
};

const handleConfirm = () => {
  const tagIds = selectedTags.value.map(tag => tag.id);
  emit('confirm', { 
    ...formData.value, 
    tagIds 
  });
  emit('update:show', false);
  resetForm();
};

// 组件挂载时加载标签
onMounted(async () => {
  await loadAllTags();
});
</script>