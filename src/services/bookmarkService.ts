import browser from 'webextension-polyfill';
import { Bookmark, BookmarkActionEvent } from '../utils/types';
import { flattenBookmarks, getBookmarkFolders } from '../utils/helpers';

class BookmarkService {
  private listeners: ((event: BookmarkActionEvent) => void)[] = [];

  private isExtensionEnvironment(): boolean {
    return typeof browser !== 'undefined' && !!browser.bookmarks;
  }

  // 获取所有书签
  async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        console.warn('不在扩展环境中，返回空书签列表');
        return [];
      }

      const bookmarkTree = await browser.bookmarks.getTree();
      return flattenBookmarks(bookmarkTree);
    } catch (error) {
      console.error('获取书签失败:', error);
      throw new Error('获取书签失败');
    }
  }

  // 获取书签树
  async getBookmarkTree(): Promise<Bookmark[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        return [];
      }

      return await browser.bookmarks.getTree();
    } catch (error) {
      console.error('获取书签树失败:', error);
      throw new Error('获取书签树失败');
    }
  }

  // 获取书签文件夹
  async getBookmarkFolders(): Promise<Bookmark[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        return [];
      }

      const bookmarkTree = await browser.bookmarks.getTree();
      return getBookmarkFolders(bookmarkTree);
    } catch (error) {
      console.error('获取书签文件夹失败:', error);
      throw new Error('获取书签文件夹失败');
    }
  }

  // 创建书签
  async createBookmark(bookmark: Partial<Bookmark>): Promise<Bookmark> {
    try {
      if (!this.isExtensionEnvironment()) {
        throw new Error('不在扩展环境中，无法创建书签');
      }

      const newBookmark = await browser.bookmarks.create({
        parentId: bookmark.parentId,
        title: bookmark.title || '',
        url: bookmark.url,
      });

      // 触发事件
      this.notifyListeners({
        action: 'create',
        bookmark: newBookmark as Bookmark,
      });

      return newBookmark as Bookmark;
    } catch (error) {
      console.error('创建书签失败:', error);
      throw new Error('创建书签失败');
    }
  }

  // 更新书签
  async updateBookmark(id: string, changes: Partial<Bookmark>): Promise<Bookmark> {
    try {
      if (!this.isExtensionEnvironment()) {
        throw new Error('不在扩展环境中，无法更新书签');
      }

      const oldBookmark = await browser.bookmarks.get(id);
      const updatedBookmark = await browser.bookmarks.update(id, {
        title: changes.title,
        url: changes.url,
      });

      // 触发事件
      this.notifyListeners({
        action: 'update',
        bookmark: updatedBookmark as Bookmark,
      });

      return updatedBookmark as Bookmark;
    } catch (error) {
      console.error('更新书签失败:', error);
      throw new Error('更新书签失败');
    }
  }

  // 删除书签
  async deleteBookmark(id: string): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        throw new Error('不在扩展环境中，无法删除书签');
      }

      const bookmark = await browser.bookmarks.get(id);
      await browser.bookmarks.remove(id);

      // 触发事件
      this.notifyListeners({
        action: 'delete',
        bookmark: bookmark[0] as Bookmark,
      });
    } catch (error) {
      console.error('删除书签失败:', error);
      throw new Error('删除书签失败');
    }
  }

  // 移动书签
  async moveBookmark(id: string, destination: { parentId?: string; index?: number }): Promise<Bookmark> {
    try {
      if (!this.isExtensionEnvironment()) {
        throw new Error('不在扩展环境中，无法移动书签');
      }

      console.log('=== BookmarkService.moveBookmark 开始 ===');
      console.log('移动参数:', { id, destination });

      // 获取原始书签信息
      const originalBookmark = await browser.bookmarks.get(id);
      console.log('原始书签信息:', originalBookmark[0]);

      // 验证目标父级是否存在
      if (destination.parentId) {
        try {
          const targetParent = await browser.bookmarks.get(destination.parentId);
          console.log('目标父级信息:', targetParent[0]);

          // 确保目标是文件夹
          if (targetParent[0].url) {
            throw new Error('目标必须是文件夹，不能是书签');
          }
        } catch (error) {
          console.error('目标父级验证失败:', error);
          throw new Error(`目标文件夹不存在或无效: ${destination.parentId}`);
        }
      }

      // 执行移动操作
      console.log('执行 Chrome API 移动操作...');
      const movedBookmark = await browser.bookmarks.move(id, destination);
      console.log('Chrome API 移动结果:', movedBookmark);

      // 验证移动是否成功
      const verifyBookmark = await browser.bookmarks.get(id);
      console.log('移动后验证:', verifyBookmark[0]);

      // 触发事件
      this.notifyListeners({
        action: 'move',
        bookmark: movedBookmark as Bookmark,
        oldParentId: originalBookmark[0].parentId,
        newParentId: destination.parentId,
      });

      console.log('=== BookmarkService.moveBookmark 完成 ===');
      return movedBookmark as Bookmark;
    } catch (error) {
      console.error('=== BookmarkService.moveBookmark 失败 ===');
      console.error('移动书签详细错误:', error);

      // 提供更友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('descendant')) {
          throw new Error('不能将文件夹移动到自己的子文件夹中');
        } else if (error.message.includes('parent')) {
          throw new Error('目标父级文件夹无效');
        } else if (error.message.includes('not found')) {
          throw new Error('要移动的书签或目标文件夹不存在');
        } else {
          throw new Error(`移动失败: ${error.message}`);
        }
      } else {
        throw new Error('移动书签时发生未知错误');
      }
    }
  }

  // 创建文件夹
  async createFolder(title: string, parentId?: string): Promise<Bookmark> {
    try {
      if (!this.isExtensionEnvironment()) {
        throw new Error('不在扩展环境中，无法创建文件夹');
      }

      const folder = await browser.bookmarks.create({
        parentId,
        title,
      });

      // 触发事件
      this.notifyListeners({
        action: 'create',
        bookmark: folder as Bookmark,
      });

      return folder as Bookmark;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw new Error('创建文件夹失败');
    }
  }

  // 获取子书签
  async getChildren(id: string): Promise<Bookmark[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        return [];
      }

      return await browser.bookmarks.getChildren(id);
    } catch (error) {
      console.error('获取子书签失败:', error);
      throw new Error('获取子书签失败');
    }
  }

  // 搜索书签
  async searchBookmarks(query: string): Promise<Bookmark[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        return [];
      }

      return await browser.bookmarks.search(query);
    } catch (error) {
      console.error('搜索书签失败:', error);
      throw new Error('搜索书签失败');
    }
  }

  // 获取最近添加的书签
  async getRecentBookmarks(numberOfItems: number = 10): Promise<Bookmark[]> {
    try {
      const bookmarks = await this.getAllBookmarks();
      return bookmarks
        .filter(bookmark => bookmark.dateAdded)
        .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
        .slice(0, numberOfItems);
    } catch (error) {
      console.error('获取最近书签失败:', error);
      throw new Error('获取最近书签失败');
    }
  }

  // 添加事件监听器
  addListener(listener: (event: BookmarkActionEvent) => void): void {
    this.listeners.push(listener);
  }

  // 移除事件监听器
  removeListener(listener: (event: BookmarkActionEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners(event: BookmarkActionEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // 设置书签监听器
  setupBookmarkListeners(): void {
    if (!this.isExtensionEnvironment()) {
      console.warn('不在扩展环境中，无法设置书签监听器');
      return;
    }

    console.log('正在设置Chrome书签API监听器...');

    browser.bookmarks.onCreated.addListener((id: string, bookmark: any) => {
      console.log('Chrome书签API: 书签/文件夹被创建', { id, bookmark });
      this.notifyListeners({
        action: 'create',
        bookmark: bookmark as Bookmark,
      });
    });

    browser.bookmarks.onRemoved.addListener((id: string, removeInfo: any) => {
      console.log('Chrome书签API: 书签/文件夹被删除', { id, removeInfo });
      this.notifyListeners({
        action: 'delete',
        bookmark: { id, ...removeInfo } as Bookmark,
      });
    });

    browser.bookmarks.onChanged.addListener((id: string, changeInfo: any) => {
      console.log('Chrome书签API: 书签/文件夹被修改', { id, changeInfo });
      this.notifyListeners({
        action: 'update',
        bookmark: { id, ...changeInfo } as Bookmark,
      });
    });

    browser.bookmarks.onMoved.addListener((id: string, moveInfo: any) => {
      console.log('Chrome书签API: 书签/文件夹被移动', { id, moveInfo });
      this.notifyListeners({
        action: 'move',
        bookmark: { id } as Bookmark,
        oldParentId: moveInfo.oldParentId,
        newParentId: moveInfo.parentId,
      });
    });

    console.log('Chrome书签API监听器设置完成');
  }
}

export const bookmarkService = new BookmarkService();