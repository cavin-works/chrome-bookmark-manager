// 书签类型定义
export interface Bookmark {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  unmodifiable?: string;
  children?: Bookmark[];
  tags?: string[];
  description?: string;
  icon?: string;
  category?: string;
}

// 书签文件夹类型
export interface BookmarkFolder {
  id: string;
  parentId?: string;
  index?: number;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: Bookmark[];
  unmodifiable?: string;
}

// AI分类结果类型
export interface AICategoryResult {
  category: string;
  confidence: number;
  tags: string[];
  description?: string;
}

// 图标信息类型
export interface IconInfo {
  url: string;
  size: number;
  type: 'favicon' | 'generated' | 'default';
}

// 用户设置类型
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list';
  showTags: boolean;
  showDescriptions: boolean;
  autoCategorize: boolean;
  aiApiKey?: string;
}

// 搜索过滤器类型
export interface SearchFilter {
  query: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 书签操作类型
export type BookmarkAction = 'create' | 'update' | 'delete' | 'move' | 'copy';

// 书签操作事件类型
export interface BookmarkActionEvent {
  action: BookmarkAction;
  bookmark: Bookmark;
  oldParentId?: string;
  newParentId?: string;
}