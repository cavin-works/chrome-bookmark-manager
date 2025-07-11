<template>
  <div class="p-6 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">标签管理</h1>
        <p class="text-muted-foreground mt-1">管理和组织您的书签标签</p>
      </div>
      <Button @click="showCreateTag = true">
        <Plus class="w-4 h-4 mr-2" />
        新建标签
      </Button>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <Tags class="w-5 h-5 text-primary" />
            <div>
              <p class="text-sm font-medium">总标签数</p>
              <p class="text-2xl font-bold">{{ allTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <Bookmark class="w-5 h-5 text-blue-500" />
            <div>
              <p class="text-sm font-medium">已标记书签</p>
              <p class="text-2xl font-bold">{{ taggedBookmarksCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <TrendingUp class="w-5 h-5 text-green-500" />
            <div>
              <p class="text-sm font-medium">常用标签</p>
              <p class="text-2xl font-bold">{{ popularTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <AlertTriangle class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-sm font-medium">未使用标签</p>
              <p class="text-2xl font-bold">{{ unusedTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 搜索和过滤 -->
    <div class="flex flex-col sm:flex-row gap-4">
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

    <!-- 标签列表 -->
    <div class="space-y-4">
      <!-- 常用标签 -->
      <div v-if="popularTags.length > 0">
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          <Star class="w-5 h-5 mr-2 text-yellow-500" />
          常用标签
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TagCard
            v-for="tag in popularTags"
            :key="tag.name"
            :tag="tag"
            @edit="editTag"
            @delete="deleteTag"
          />
        </div>
      </div>

      <!-- 所有标签 -->
      <div>
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          <Tags class="w-5 h-5 mr-2" />
          所有标签 ({{ filteredTags.length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TagCard
            v-for="tag in filteredTags"
            :key="tag.name"
            :tag="tag"
            @edit="editTag"
            @delete="deleteTag"
          />
        </div>
      </div>

      <!-- 未使用标签 -->
      <div v-if="unusedTags.length > 0">
        <h3 class="text-lg font-semibold mb-3 flex items-center text-orange-600">
          <AlertTriangle class="w-5 h-5 mr-2" />
          未使用标签
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TagCard
            v-for="tag in unusedTags"
            :key="tag.name"
            :tag="tag"
            variant="warning"
            @edit="editTag"
            @delete="deleteTag"
          />
        </div>
      </div>
    </div>

    <!-- 创建标签对话框 -->
    <Dialog :open="showCreateTag" @update:open="showCreateTag = $event">
      <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>创建新标签</DialogTitle>
          <DialogDescription>
            为您的书签创建一个新的标签分类
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">标签名称</label>
              <Input
                v-model="newTagName"
                placeholder="输入标签名称"
                @keyup.enter="createTag"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">颜色</label>
              <div class="grid grid-cols-6 gap-2">
                <button
                  v-for="color in tagColors"
                  :key="color"
                  :class="cn(
                    'w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform',
                    newTagColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  )"
                  :style="{ backgroundColor: color }"
                  @click="newTagColor = color"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">描述（可选）</label>
              <Input
                v-model="newTagDescription"
                placeholder="标签描述"
                class="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="flex-shrink-0">
          <Button variant="outline" @click="showCreateTag = false">取消</Button>
          <Button @click="createTag" :disabled="!newTagName.trim()">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 编辑标签对话框 -->
    <Dialog :open="showEditTag" @update:open="showEditTag = $event">
      <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>编辑标签</DialogTitle>
          <DialogDescription>
            修改标签的名称、颜色和描述
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4" v-if="editingTag">
            <div class="space-y-2">
              <label class="text-sm font-medium">标签名称</label>
              <Input
                v-model="editingTag.name"
                placeholder="输入标签名称"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">颜色</label>
              <div class="grid grid-cols-6 gap-2">
                <button
                  v-for="color in tagColors"
                  :key="color"
                  :class="cn(
                    'w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform',
                    editingTag.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  )"
                  :style="{ backgroundColor: color }"
                  @click="editingTag.color = color"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">描述</label>
              <Input
                v-model="editingTag.description"
                placeholder="标签描述"
                class="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="flex-shrink-0">
          <Button variant="outline" @click="showEditTag = false">取消</Button>
          <Button @click="saveTag">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Tags, 
  Bookmark, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Star 
} from 'lucide-vue-next';
import TagCard from '@/components/TagCard.vue';

// 标签类型定义
interface Tag {
  name: string;
  color: string;
  description?: string;
  usage: number;
  createdAt: Date;
  lastUsed?: Date;
}

// 响应式状态
const searchQuery = ref('');
const sortBy = ref('usage');
const showCreateTag = ref(false);
const showEditTag = ref(false);
const editingTag = ref<Tag | null>(null);

// 新标签创建
const newTagName = ref('');
const newTagColor = ref('#3b82f6');
const newTagDescription = ref('');

// 标签颜色选项
const tagColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// 模拟数据（实际使用时从 props 或 store 获取）
const allTags = ref<Tag[]>([
  {
    name: '前端开发',
    color: '#3b82f6',
    description: '前端技术相关',
    usage: 25,
    createdAt: new Date('2024-01-01'),
    lastUsed: new Date()
  },
  {
    name: 'Vue.js',
    color: '#10b981',
    description: 'Vue.js 框架',
    usage: 18,
    createdAt: new Date('2024-01-05'),
    lastUsed: new Date()
  },
  {
    name: '设计灵感',
    color: '#ec4899',
    description: '设计相关资源',
    usage: 12,
    createdAt: new Date('2024-01-10'),
    lastUsed: new Date('2024-01-20')
  },
  {
    name: '待读',
    color: '#f59e0b',
    description: '稍后阅读',
    usage: 8,
    createdAt: new Date('2024-01-15'),
    lastUsed: new Date('2024-01-18')
  },
  {
    name: '工具',
    color: '#8b5cf6',
    description: '实用工具',
    usage: 0,
    createdAt: new Date('2024-01-20')
  }
]);

// 计算属性
const taggedBookmarksCount = computed(() => {
  return allTags.value.reduce((total, tag) => total + tag.usage, 0);
});

const popularTags = computed(() => {
  return allTags.value.filter(tag => tag.usage >= 10).sort((a, b) => b.usage - a.usage);
});

const unusedTags = computed(() => {
  return allTags.value.filter(tag => tag.usage === 0);
});

const filteredTags = computed(() => {
  let result = allTags.value;

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

// 标签操作方法
const createTag = () => {
  if (!newTagName.value.trim()) return;

  const newTag: Tag = {
    name: newTagName.value.trim(),
    color: newTagColor.value,
    description: newTagDescription.value.trim() || undefined,
    usage: 0,
    createdAt: new Date()
  };

  allTags.value.push(newTag);
  
  // 重置表单
  newTagName.value = '';
  newTagColor.value = '#3b82f6';
  newTagDescription.value = '';
  showCreateTag.value = false;
};

const editTag = (tag: Tag) => {
  editingTag.value = { ...tag };
  showEditTag.value = true;
};

const saveTag = () => {
  if (!editingTag.value) return;

  const index = allTags.value.findIndex(tag => tag.name === editingTag.value?.name);
  if (index !== -1) {
    allTags.value[index] = { ...editingTag.value };
  }

  showEditTag.value = false;
  editingTag.value = null;
};

const deleteTag = (tag: Tag) => {
  const index = allTags.value.findIndex(t => t.name === tag.name);
  if (index !== -1) {
    allTags.value.splice(index, 1);
  }
};

onMounted(() => {
  // 组件挂载时的初始化操作
  console.log('标签管理页面已加载');
});
</script>