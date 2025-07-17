<template>
  <div class="space-y-4">
    <!-- 搜索和过滤 -->
    <div v-if="showFilters && tags.length > 0" class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <Input
          v-model="searchQuery"
          placeholder="搜索标签..."
          class="w-full"
        >
          <template #prefix>
            <Search class="w-4 h-4" />
          </template>
        </Input>
      </div>
      <Select v-model="sortBy">
        <SelectTrigger class="w-48">
          <SelectValue placeholder="排序方式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">按名称</SelectItem>
          <SelectItem value="usage">按使用次数</SelectItem>
          <SelectItem value="created">按创建时间</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 空状态 - 没有标签时显示 -->
    <div v-if="tags.length === 0" class="text-center py-12">
      <div class="max-w-md mx-auto">
        <Tags class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">还没有创建标签</h3>
        <p class="text-gray-500 mb-6">
          标签可以帮助您更好地组织和管理书签。可以试试 AI 自动生成哦~~
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <Button @click="$emit('ai-generate')" class="flex items-center">
            <Sparkles class="w-4 h-4 mr-2" />
            AI 智能生成标签
          </Button>
          <Button variant="outline" @click="$emit('create-tag')" class="flex items-center">
            <Plus class="w-4 h-4 mr-2" />
            手动创建标签
          </Button>
        </div>
      </div>
    </div>

    <!-- 有标签时显示标签列表 -->
    <template v-else>
      <!-- 常用标签 -->
      <div v-if="popularTags.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold flex items-center">
            <Star class="w-5 h-5 mr-2 text-yellow-500" />
            常用标签
          </h3>
          <div v-if="popularTags.length > 3" class="flex items-center text-sm text-muted-foreground">
            <span class="mr-2">滑动查看更多</span>
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>
        <div class="relative">
          <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
            <div 
              v-for="tag in popularTags" 
              :key="tag.name"
              class="flex-shrink-0 w-64"
            >
              <TagCard
                :tag="tag"
                @edit="handleEditTag"
                @delete="handleDeleteTag"
                @select="handleSelectTag"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 所有标签 -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          <Tags class="w-5 h-5 mr-2" />
          所有标签 ({{ filteredTags.length }})
        </h3>
        <div v-if="filteredTags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TagCard
            v-for="tag in filteredTags"
            :key="tag.name"
            :tag="tag"
            @edit="handleEditTag"
            @delete="handleDeleteTag"
            @select="handleSelectTag"
          />
        </div>
        <div v-else class="text-center py-8">
          <p class="text-gray-500">没有找到匹配的标签</p>
          <p class="text-sm text-gray-400 mt-1">尝试调整搜索条件或创建新标签</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Tags,
  Search,
  Sparkles,
  Star,
  ArrowRight
} from 'lucide-vue-next';
import TagCard from './TagCard.vue';
import type { Tag } from '@/services/tagStorageService';

interface Props {
  tags: Tag[];
  showFilters?: boolean;
  popularTags?: Tag[];
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  showFilters: true,
  popularTags: () => []
});

const emit = defineEmits<{
  'edit-tag': [tag: Tag];
  'delete-tag': [tag: Tag];
  'select-tag': [tag: Tag];
  'create-tag': [];
  'ai-generate': [];
}>();

// 响应式状态
const searchQuery = ref('');
const sortBy = ref('usage');

// 计算属性 - 过滤后的标签
const filteredTags = computed(() => {
  let result = props.tags;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(tag =>
      tag.name.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query)
    );
  }

  // 排序
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'usage':
      result.sort((a, b) => b.usage - a.usage);
      break;
    case 'created':
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  return result;
});

// 事件处理
const handleEditTag = (tag: Tag) => {
  emit('edit-tag', tag);
};

const handleDeleteTag = (tag: Tag) => {
  emit('delete-tag', tag);
};

const handleSelectTag = (tag: Tag) => {
  emit('select-tag', tag);
};

// 监听标签变化，重置搜索
watch(() => props.tags, () => {
  searchQuery.value = '';
});
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  scroll-behavior: smooth;
}

.tag-card-container {
  min-width: 256px;
}
</style>