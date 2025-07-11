<template>
  <nav class="bg-background border-b">
    <div class="flex items-center justify-between px-4 h-12">
      <!-- 左侧导航 -->
      <div class="flex items-center space-x-1">
        <Button
          v-for="route in routes"
          :key="route.name"
          :variant="currentRoute === route.name ? 'default' : 'ghost'"
          size="sm"
          @click="navigateTo(route.name)"
          class="flex items-center space-x-2"
        >
          <component :is="getIcon(route.meta.icon)" class="w-4 h-4" />
          <span>{{ route.meta.title }}</span>
        </Button>
      </div>

      <!-- 右侧操作 -->
      <div class="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('add-bookmark')"
          class="flex items-center space-x-2"
        >
          <Plus class="w-4 h-4" />
          <span>添加书签</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('toggle-theme')"
          class="w-8 h-8 p-0"
        >
          <Sun v-if="theme === 'light'" class="w-4 h-4" />
          <Moon v-else-if="theme === 'dark'" class="w-4 h-4" />
          <Monitor v-else class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Sun, 
  Moon, 
  Monitor,
  Home,
  Search,
  Tags,
  Settings
} from 'lucide-vue-next';

// Props
interface Props {
  theme: 'light' | 'dark' | 'auto';
}

defineProps<Props>();

// Events
defineEmits<{
  'add-bookmark': [];
  'toggle-theme': [];
}>();

// 路由
const router = useRouter();
const route = useRoute();

// 导航路由配置
const routes = [
  {
    name: 'home',
    meta: { title: '书签管理', icon: 'Home' }
  },
  {
    name: 'search',
    meta: { title: '搜索', icon: 'Search' }
  },
  {
    name: 'tags',
    meta: { title: '标签管理', icon: 'Tags' }
  },
  {
    name: 'settings',
    meta: { title: '设置', icon: 'Settings' }
  }
];

// 当前路由
const currentRoute = computed(() => route.name);

// 导航到指定路由
const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};

// 获取图标组件
const getIcon = (iconName: string) => {
  const icons = {
    Home,
    Search,
    Tags,
    Settings
  };
  return icons[iconName as keyof typeof icons] || Home;
};
</script>