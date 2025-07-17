<template>
  <div class="p-6 space-y-6">
    <!-- 页面标题和按钮 -->
    <TagManagerHeader
      :can-deduplicate="allTags.length > 0"
      :is-deduplicating="deduplication.isDeduplicating"
      :can-organize="true"
      :untagged-count="untaggedCount"
      @deduplicate="openDeduplicateDialog"
      @ai-organize="openAIOrganizeDialog"
      @ai-generate="openAIGenerateDialog"
      @create-tag="openCreateTagDialog"
    />

    <!-- 统计信息 -->
    <TagStatistics
      :total-tags="allTags.length"
      :tagged-bookmarks-count="taggedBookmarksCount"
      :untagged-bookmarks-count="untaggedCount"
      :popular-tags-count="popularTags.length"
    />

    <!-- 标签列表 -->
    <TagList
      v-if="!selectedTagName"
      :tags="filteredTags"
      :popular-tags="popularTags"
      :show-filters="true"
      @edit-tag="openEditTagDialog"
      @delete-tag="handleDeleteTag"
      @select-tag="selectTag"
      @create-tag="openCreateTagDialog"
      @ai-generate="openAIGenerateDialog"
    />

    <!-- 标签书签展示区域 -->
    <div v-if="selectedTagName" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold flex items-center">
            <Tags class="w-5 h-5 mr-2" />
            "{{ selectedTagName }}" 标签的书签
          </h2>
          <p class="text-sm text-muted-foreground">
            共 {{ filteredBookmarks.length }} 个书签使用了此标签
          </p>
        </div>
        <Button @click="clearTagSelection" variant="outline" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          返回标签管理
        </Button>
      </div>

      <BookmarkGrid
        :filtered-bookmarks="filteredBookmarks"
        :bookmark-folders="[]"
        :search-query="''"
        :layout="'grid'"
        :loading="false"
        @add-bookmark="$emit('add-bookmark')"
        @open-bookmark="$emit('open-bookmark', $event)"
        @edit-bookmark="$emit('edit-bookmark', $event)"
        @delete-bookmark="$emit('delete-bookmark', $event)"
      />
    </div>

    <!-- 创建标签对话框 -->
    <CreateTagDialog
      v-model:open="dialogs.showCreateTag"
      @confirm="handleCreateTag"
    />

    <!-- 编辑标签对话框 -->
    <EditTagDialog
      v-model:open="dialogs.showEditTag"
      :tag="editingTag"
      @confirm="handleUpdateTag"
    />

    <!-- AI 生成标签对话框 -->
    <AIGenerateTagsDialog
      v-model:open="dialogs.showAIGenerate"
      :bookmarks="bookmarks"
      :existing-tags="allTags.map(t => t.name)"
      @confirm="handleAIGeneratedTags"
    />

    <!-- AI 一键整理对话框 -->
    <AIOrganizeDialog
      v-model:open="dialogs.showAIOrganize"
      :bookmarks="bookmarks"
      :existing-tags="allTags.map(t => t.name)"
      @confirm="handleAIOrganizeResult"
    />

    <!-- 去重标签确认对话框 -->
    <DeduplicateConfirmDialog
      v-model:open="deduplication.showConfirmDialog"
      @confirm="handleDeduplicate"
    />

    <!-- 去重结果对话框 -->
    <DeduplicateResultDialog
      v-model:open="deduplication.showResultDialog"
      :result="deduplication.result"
      @close="deduplication.resetState"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useTags } from '@/composables/useTags';
import { useAITags } from '@/composables/useAITags';
import { useTagOrganizer } from '@/composables/useTagOrganizer';
import { useTagDeduplication } from '@/composables/useTagDeduplication';

// 组件导入
import TagManagerHeader from '@/components/TagManagerHeader.vue';
import TagStatistics from '@/components/TagStatistics.vue';
import TagList from '@/components/TagList.vue';
import BookmarkGrid from '@/components/BookmarkGrid.vue';

// 对话框组件
import CreateTagDialog from '@/components/dialogs/CreateTagDialog.vue';
import EditTagDialog from '@/components/dialogs/EditTagDialog.vue';
import AIGenerateTagsDialog from '@/components/dialogs/AIGenerateTagsDialog.vue';
import AIOrganizeDialog from '@/components/dialogs/AIOrganizeDialog.vue';
import DeduplicateConfirmDialog from '@/components/dialogs/DeduplicateConfirmDialog.vue';
import DeduplicateResultDialog from '@/components/dialogs/DeduplicateResultDialog.vue';

// 类型定义
import type { Bookmark } from '@/utils/types';
import type { Tag } from '@/services/tagStorageService';

// Props 定义
interface Props {
  bookmarks?: Bookmark[];
}

const props = withDefaults(defineProps<Props>(), {
  bookmarks: () => []
});

const emit = defineEmits<{
  'add-bookmark': [];
  'open-bookmark': [bookmark: Bookmark];
  'edit-bookmark': [bookmark: Bookmark];
  'delete-bookmark': [bookmark: Bookmark];
}>();

// 状态管理
const selectedTagName = ref<string | null>(null);
const editingTag = ref<Tag | null>(null);

// 对话框状态
const dialogs = reactive({
  showCreateTag: false,
  showEditTag: false,
  showAIGenerate: false,
  showAIOrganize: false
});

// 使用 hooks
const tagsHook = useTags({ 
  bookmarks: props.bookmarks,
  autoLoad: true 
});

const aiTagsHook = useAITags({ 
  bookmarks: props.bookmarks,
  existingTags: computed(() => tagsHook.allTags.value.map(t => t.name)).value
});

const tagOrganizerHook = useTagOrganizer({ 
  bookmarks: props.bookmarks,
  existingTags: computed(() => tagsHook.allTags.value.map(t => t.name)).value
});

const deduplication = useTagDeduplication();

// 计算属性
const { allTags, taggedBookmarksCount, popularTags } = tagsHook;
const { untaggedCount } = tagOrganizerHook;

// 过滤后的标签
const filteredTags = computed(() => {
  // 使用 tagsHook 的过滤逻辑，这里简单返回所有标签
  return allTags.value;
});

// 过滤后的书签
const filteredBookmarks = computed(() => {
  if (!selectedTagName.value) return [];
  
  return props.bookmarks.filter(bookmark => {
    const hasTags = bookmark.tags && Array.isArray(bookmark.tags) && bookmark.tags.length > 0;
    return hasTags && bookmark.tags!.includes(selectedTagName.value);
  });
});

// 事件处理函数
const openCreateTagDialog = () => {
  dialogs.showCreateTag = true;
};

const openEditTagDialog = (tag: Tag) => {
  editingTag.value = tag;
  dialogs.showEditTag = true;
};

const openAIGenerateDialog = () => {
  dialogs.showAIGenerate = true;
};

const openAIOrganizeDialog = () => {
  dialogs.showAIOrganize = true;
};

const openDeduplicateDialog = () => {
  deduplication.openConfirmDialog();
};

const handleCreateTag = async (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
  await tagsHook.createTag(tagData);
  dialogs.showCreateTag = false;
};

const handleUpdateTag = async (tagData: Partial<Tag>) => {
  if (editingTag.value) {
    await tagsHook.updateTag(editingTag.value.id, tagData);
    dialogs.showEditTag = false;
    editingTag.value = null;
  }
};

const handleDeleteTag = async (tag: Tag) => {
  await tagsHook.deleteTag(tag.id);
};

const handleAIGeneratedTags = async (tags: string[]) => {
  // 批量创建AI生成的标签
  for (const tagName of tags) {
    const color = getRandomColor();
    await tagsHook.createTag({ name: tagName, color, usage: 0 });
  }
  dialogs.showAIGenerate = false;
};

const handleAIOrganizeResult = async (result: any) => {
  await tagOrganizerHook.confirmAIOrganize(result);
  dialogs.showAIOrganize = false;
  await tagsHook.refreshTags();
};

const handleDeduplicate = async () => {
  await deduplication.performDeduplication();
  await tagsHook.refreshTags();
};

const selectTag = (tag: Tag) => {
  selectedTagName.value = tag.name;
};

const clearTagSelection = () => {
  selectedTagName.value = null;
};

// 工具函数
const getRandomColor = () => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#e11d48'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 监听书签变化
watch(() => props.bookmarks, () => {
  tagsHook.loadBookmarkTags(props.bookmarks);
}, { deep: true });
</script>

<style scoped>
/* 样式已经在组件中定义 */
</style>