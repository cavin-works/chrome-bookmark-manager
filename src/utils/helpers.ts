import { Bookmark, BookmarkFolder, SearchFilter } from './types';

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// 扁平化书签树
export function flattenBookmarks(bookmarkTree: Bookmark[]): Bookmark[] {
  const result: Bookmark[] = [];

  function traverse(bookmarks: Bookmark[]) {
    for (const bookmark of bookmarks) {
      if (bookmark.url) {
        result.push(bookmark);
      }
      if (bookmark.children) {
        traverse(bookmark.children);
      }
    }
  }

  traverse(bookmarkTree);
  return result;
}

// 获取书签文件夹
export function getBookmarkFolders(bookmarkTree: Bookmark[]): BookmarkFolder[] {
  const folders: BookmarkFolder[] = [];
  console.log('getBookmarkFolders - 输入的bookmarkTree:', bookmarkTree);

  function traverse(bookmarks: Bookmark[], depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}遍历层级 ${depth}, 书签数量: ${bookmarks.length}`);

    for (const bookmark of bookmarks) {
      console.log(`${indent}处理项目: ${bookmark.title} (id: ${bookmark.id})`);
      console.log(`${indent}  - url: ${bookmark.url || '无URL'}`);
      console.log(`${indent}  - parentId: ${bookmark.parentId || '无parentId'}`);
      console.log(`${indent}  - children存在: ${!!bookmark.children}, 长度: ${bookmark.children?.length || 0}`);

      if (!bookmark.url && bookmark.children) {
        console.log(`${indent}  -> 这是一个文件夹`);

        // 跳过空标题或无效标题的文件夹
        if (!bookmark.title || bookmark.title.trim() === '') {
          console.warn(`${indent}跳过空标题文件夹:`, bookmark);
          // 继续处理子文件夹
          traverse(bookmark.children, depth + 1);
          continue;
        }

        const folder: BookmarkFolder = {
          id: bookmark.id,
          parentId: bookmark.parentId,
          index: bookmark.index,
          title: bookmark.title,
          dateAdded: bookmark.dateAdded,
          dateGroupModified: bookmark.dateGroupModified,
          children: bookmark.children,
          unmodifiable: bookmark.unmodifiable,
        };

        console.log(`${indent}  -> 添加文件夹到结果:`, folder);
        folders.push(folder);
        traverse(bookmark.children, depth + 1);
      } else {
        console.log(`${indent}  -> 这是一个书签，跳过`);
      }
    }
  }

  traverse(bookmarkTree);
  console.log('getBookmarkFolders - 最终结果:', folders);
  return folders;
}

// 搜索书签
export function searchBookmarks(
  bookmarks: Bookmark[],
  filter: SearchFilter
): Bookmark[] {
  return bookmarks.filter(bookmark => {
    // 文本搜索
    if (filter.query) {
      const query = filter.query.toLowerCase();
      const title = bookmark.title.toLowerCase();
      const url = bookmark.url?.toLowerCase() || '';
      const description = bookmark.description?.toLowerCase() || '';
      const tags = bookmark.tags?.join(' ').toLowerCase() || '';

      if (!title.includes(query) &&
          !url.includes(query) &&
          !description.includes(query) &&
          !tags.includes(query)) {
        return false;
      }
    }

    // 分类过滤
    if (filter.category && bookmark.category !== filter.category) {
      return false;
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      if (!bookmark.tags || !filter.tags.some(tag => bookmark.tags!.includes(tag))) {
        return false;
      }
    }

    // 日期范围过滤
    if (filter.dateRange && bookmark.dateAdded) {
      const date = new Date(bookmark.dateAdded);
      if (date < filter.dateRange.start || date > filter.dateRange.end) {
        return false;
      }
    }

    return true;
  });
}

// 格式化日期
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)}周前`;
  } else if (days < 365) {
    return `${Math.floor(days / 30)}个月前`;
  } else {
    return `${Math.floor(days / 365)}年前`;
  }
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

// 生成随机ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 获取域名
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// 验证URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 深拷贝对象
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

// 获取屏幕断点
export function getScreenBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'wide';
}

// 检测系统主题
export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}