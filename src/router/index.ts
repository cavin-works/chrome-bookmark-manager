import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// 导入页面组件
import BookmarkHome from '@/pages/newtab/BookmarkHome.vue';
import TagManager from '@/pages/newtab/TagManager.vue';
import BookmarkSearch from '@/pages/newtab/BookmarkSearch.vue';
import Settings from '@/pages/newtab/Settings.vue';

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: BookmarkHome,
    meta: {
      title: '书签管理',
      icon: 'Home'
    }
  },
  {
    path: '/search',
    name: 'search',
    component: BookmarkSearch,
    meta: {
      title: '搜索书签',
      icon: 'Search'
    }
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagManager,
    meta: {
      title: '标签管理',
      icon: 'Tags'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: '设置',
      icon: 'Settings'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  // 使用 hash 模式，适合 Chrome 扩展
  history: createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Humi Bookmarks`;
  }
  next();
});

export default router;