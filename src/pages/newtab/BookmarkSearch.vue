<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- 页面标题 -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold">高级搜索</h1>
        <p class="text-muted-foreground">搜索和发现您的书签</p>
      </div>

      <!-- 搜索表单 -->
      <Card class="p-6">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">关键词</label>
              <Input
                v-model="searchQuery"
                placeholder="搜索标题、URL、描述..."
                class="w-full"
                @keyup.enter="performSearch"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">标签</label>
              <Input
                v-model="tagQuery"
                placeholder="搜索标签..."
                class="w-full"
                @keyup.enter="performSearch"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">分类</label>
              <Select v-model="selectedCategory">
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  <SelectItem value="工具">工具</SelectItem>
                  <SelectItem value="技术">技术</SelectItem>
                  <SelectItem value="设计">设计</SelectItem>
                  <SelectItem value="学习">学习</SelectItem>
                  <SelectItem value="娱乐">娱乐</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">时间范围</label>
              <Select v-model="dateRange">
                <SelectTrigger>
                  <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">最近一周</SelectItem>
                  <SelectItem value="month">最近一个月</SelectItem>
                  <SelectItem value="year">最近一年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex justify-center">
            <Button @click="performSearch" class="w-full md:w-auto">
              <Search class="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </div>
      </Card>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">搜索结果 ({{ searchResults.length }})</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-muted-foreground">排序：</span>
            <Select v-model="sortBy">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">相关性</SelectItem>
                <SelectItem value="date">添加时间</SelectItem>
                <SelectItem value="title">标题</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="bookmark in sortedResults"
            :key="bookmark.id"
            class="p-4 cursor-pointer hover:shadow-md transition-shadow"
            @click="openBookmark(bookmark)"
          >
            <div class="flex items-start space-x-3">
              <img
                :src="bookmark.icon || '/default-icon.png'"
                :alt="bookmark.title"
                class="w-8 h-8 rounded flex-shrink-0"
                @error="handleImageError"
              />
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate">{{ bookmark.title }}</h3>
                <p class="text-sm text-muted-foreground truncate">
                  {{ bookmark.url }}
                </p>
                <div v-if="bookmark.description" class="text-xs text-muted-foreground mt-1">
                  {{ bookmark.description }}
                </div>
                <div v-if="bookmark.tags && bookmark.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="tag in bookmark.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="hasSearched" class="text-center py-12">
        <Search class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">没有找到相关书签</h3>
        <p class="text-muted-foreground">
          尝试调整搜索条件或使用不同的关键词
        </p>
      </div>

      <!-- 默认状态 -->
      <div v-else class="text-center py-12">
        <Search class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">开始搜索您的书签</h3>
        <p class="text-muted-foreground">
          输入关键词、标签或选择分类来查找书签
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-vue-next';

// 书签类型定义
interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  tags?: string[];
  category?: string;
  dateAdded?: number;
}

// 搜索状态
const searchQuery = ref('');
const tagQuery = ref('');
const selectedCategory = ref('all');
const dateRange = ref('all');
const sortBy = ref('relevance');
const searchResults = ref<Bookmark[]>([]);
const hasSearched = ref(false);

// 模拟书签数据
const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    title: 'Vue.js 官方文档',
    url: 'https://vuejs.org',
    icon: 'https://vuejs.org/logo.svg',
    description: 'Vue.js 官方文档和教程',
    tags: ['Vue', '前端', '框架'],
    category: '技术',
    dateAdded: Date.now() - 86400000
  },
  {
    id: '2',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    icon: 'https://tailwindcss.com/favicon.ico',
    description: '实用优先的 CSS 框架',
    tags: ['CSS', '前端', '框架'],
    category: '技术',
    dateAdded: Date.now() - 172800000
  },
  {
    id: '3',
    title: 'Figma',
    url: 'https://figma.com',
    icon: 'https://figma.com/favicon.ico',
    description: '协作设计工具',
    tags: ['设计', '工具', '协作'],
    category: '设计',
    dateAdded: Date.now() - 259200000
  }
];

// 排序后的结果
const sortedResults = computed(() => {
  const results = [...searchResults.value];
  
  switch (sortBy.value) {
    case 'date':
      return results.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    case 'title':
      return results.sort((a, b) => a.title.localeCompare(b.title));
    case 'relevance':
    default:
      return results;
  }
});

// 搜索方法
const performSearch = () => {
  hasSearched.value = true;
  
  let results = mockBookmarks;
  
  // 关键词搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    results = results.filter(bookmark =>
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      bookmark.description?.toLowerCase().includes(query)
    );
  }
  
  // 标签搜索
  if (tagQuery.value.trim()) {
    const tagQuery_ = tagQuery.value.toLowerCase();
    results = results.filter(bookmark =>
      bookmark.tags?.some(tag => tag.toLowerCase().includes(tagQuery_))
    );
  }
  
  // 分类过滤
  if (selectedCategory.value !== 'all') {
    results = results.filter(bookmark => bookmark.category === selectedCategory.value);
  }
  
  // 时间范围过滤
  if (dateRange.value !== 'all') {
    const now = Date.now();
    const ranges = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    
    const range = ranges[dateRange.value as keyof typeof ranges];
    if (range) {
      results = results.filter(bookmark => 
        bookmark.dateAdded && (now - bookmark.dateAdded) <= range
      );
    }
  }
  
  searchResults.value = results;
};

// 打开书签
const openBookmark = (bookmark: Bookmark) => {
  window.open(bookmark.url, '_blank');
};

// 图片错误处理
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = '/default-icon.png';
};

// 组件挂载
onMounted(() => {
  console.log('搜索页面已加载');
});
</script>