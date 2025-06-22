// 默认设置
export const DEFAULT_SETTINGS = {
  theme: 'auto' as const,
  layout: 'grid' as const,
  showTags: true,
  showDescriptions: true,
  autoCategorize: true,
};

// 存储键名
export const STORAGE_KEYS = {
  SETTINGS: 'humi_settings',
  ICON_CACHE: 'humi_icon_cache',
  CATEGORY_CACHE: 'humi_category_cache',
  USER_CATEGORIES: 'humi_user_categories',
} as const;

// 图标相关
export const ICON_CONFIG = {
  DEFAULT_SIZE: 32,
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天
  FALLBACK_ICON: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y1RjVGNiIvPgo8cGF0aCBkPSJNMTYgOEwxMiAxMkwxNiAxNkwxMiAyMEg4TDEyIDE2SDhWMTJIMTJMMTggOEgxNloiIGZpbGw9IiM2Qjc4OTAiLz4KPC9zdmc+',
} as const;

// AI服务配置
export const AI_CONFIG = {
  DEFAULT_CATEGORIES: [
    '工作',
    '学习',
    '娱乐',
    '购物',
    '新闻',
    '技术',
    '生活',
    '工具',
    '社交',
    '其他'
  ],
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_TAGS: 5,
} as const;

// UI配置
export const UI_CONFIG = {
  GRID_COLUMNS: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    wide: 6,
  },
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  BOOKMARK_LOAD_FAILED: '加载书签失败',
  BOOKMARK_CREATE_FAILED: '创建书签失败',
  BOOKMARK_UPDATE_FAILED: '更新书签失败',
  BOOKMARK_DELETE_FAILED: '删除书签失败',
  ICON_LOAD_FAILED: '加载图标失败',
  AI_CATEGORIZE_FAILED: 'AI分类失败',
  STORAGE_ACCESS_FAILED: '存储访问失败',
  NETWORK_ERROR: '网络连接错误',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  BOOKMARK_CREATED: '书签创建成功',
  BOOKMARK_UPDATED: '书签更新成功',
  BOOKMARK_DELETED: '书签删除成功',
  SETTINGS_SAVED: '设置保存成功',
  CATEGORY_CREATED: '分类创建成功',
} as const;