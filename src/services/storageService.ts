import browser from 'webextension-polyfill';
import { UserSettings } from '../utils/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants';

class StorageService {
  private isExtensionEnvironment(): boolean {
    return typeof browser !== 'undefined' && !!browser.storage;
  }

  // 获取设置
  async getSettings(): Promise<UserSettings> {
    try {
      if (!this.isExtensionEnvironment()) {
        console.warn('不在扩展环境中，使用默认设置');
        return DEFAULT_SETTINGS;
      }

      const result = await browser.storage.sync.get(STORAGE_KEYS.SETTINGS);
      return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
    } catch (error) {
      console.error('获取设置失败:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // 保存设置
  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        console.warn('不在扩展环境中，无法保存设置');
        return;
      }

      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await browser.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: newSettings,
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      throw new Error('保存设置失败');
    }
  }

  // 获取图标缓存
  async getIconCache(): Promise<{ [key: string]: any }> {
    try {
      if (!this.isExtensionEnvironment()) {
        return {};
      }

      const result = await browser.storage.local.get(STORAGE_KEYS.ICON_CACHE);
      return result[STORAGE_KEYS.ICON_CACHE] || {};
    } catch (error) {
      console.error('获取图标缓存失败:', error);
      return {};
    }
  }

  // 保存图标缓存
  async saveIconCache(cache: { [key: string]: any }): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        return;
      }

      await browser.storage.local.set({
        [STORAGE_KEYS.ICON_CACHE]: cache,
      });
    } catch (error) {
      console.error('保存图标缓存失败:', error);
    }
  }

  // 获取分类缓存
  async getCategoryCache(): Promise<{ [key: string]: any }> {
    try {
      if (!this.isExtensionEnvironment()) {
        return {};
      }

      const result = await browser.storage.local.get(STORAGE_KEYS.CATEGORY_CACHE);
      return result[STORAGE_KEYS.CATEGORY_CACHE] || {};
    } catch (error) {
      console.error('获取分类缓存失败:', error);
      return {};
    }
  }

  // 保存分类缓存
  async saveCategoryCache(cache: { [key: string]: any }): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        return;
      }

      await browser.storage.local.set({
        [STORAGE_KEYS.CATEGORY_CACHE]: cache,
      });
    } catch (error) {
      console.error('保存分类缓存失败:', error);
    }
  }

  // 获取用户自定义分类
  async getUserCategories(): Promise<string[]> {
    try {
      if (!this.isExtensionEnvironment()) {
        return [];
      }

      const result = await browser.storage.sync.get(STORAGE_KEYS.USER_CATEGORIES);
      return result[STORAGE_KEYS.USER_CATEGORIES] || [];
    } catch (error) {
      console.error('获取用户分类失败:', error);
      return [];
    }
  }

  // 保存用户自定义分类
  async saveUserCategories(categories: string[]): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        return;
      }

      await browser.storage.sync.set({
        [STORAGE_KEYS.USER_CATEGORIES]: categories,
      });
    } catch (error) {
      console.error('保存用户分类失败:', error);
      throw new Error('保存用户分类失败');
    }
  }

  // 添加用户自定义分类
  async addUserCategory(category: string): Promise<void> {
    try {
      const categories = await this.getUserCategories();
      if (!categories.includes(category)) {
        categories.push(category);
        await this.saveUserCategories(categories);
      }
    } catch (error) {
      console.error('添加用户分类失败:', error);
      throw new Error('添加用户分类失败');
    }
  }

  // 删除用户自定义分类
  async removeUserCategory(category: string): Promise<void> {
    try {
      const categories = await this.getUserCategories();
      const filteredCategories = categories.filter(c => c !== category);
      await this.saveUserCategories(filteredCategories);
    } catch (error) {
      console.error('删除用户分类失败:', error);
      throw new Error('删除用户分类失败');
    }
  }

  // 清除所有缓存
  async clearCache(): Promise<void> {
    try {
      if (!this.isExtensionEnvironment()) {
        return;
      }

      await browser.storage.local.remove([
        STORAGE_KEYS.ICON_CACHE,
        STORAGE_KEYS.CATEGORY_CACHE,
      ]);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  // 导出数据
  async exportData(): Promise<{ settings: UserSettings; categories: string[] }> {
    try {
      const [settings, categories] = await Promise.all([
        this.getSettings(),
        this.getUserCategories(),
      ]);

      return { settings, categories };
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new Error('导出数据失败');
    }
  }

  // 导入数据
  async importData(data: { settings?: UserSettings; categories?: string[] }): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (data.settings) {
        promises.push(this.saveSettings(data.settings));
      }

      if (data.categories) {
        promises.push(this.saveUserCategories(data.categories));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new Error('导入数据失败');
    }
  }

  // 获取存储使用情况
  async getStorageUsage(): Promise<{ sync: number; local: number }> {
    try {
      if (!this.isExtensionEnvironment()) {
        return { sync: 0, local: 0 };
      }

            // 检查 getBytesInUse 方法是否存在
      const promises: Promise<number>[] = [];

      if (typeof (browser.storage.sync as any).getBytesInUse === 'function') {
        promises.push((browser.storage.sync as any).getBytesInUse());
      } else {
        promises.push(Promise.resolve(0));
      }

      if (typeof (browser.storage.local as any).getBytesInUse === 'function') {
        promises.push((browser.storage.local as any).getBytesInUse());
      } else {
        promises.push(Promise.resolve(0));
      }

      const [syncUsage, localUsage] = await Promise.all(promises);

      return {
        sync: syncUsage,
        local: localUsage,
      };
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return { sync: 0, local: 0 };
    }
  }

  // 监听存储变化
  onStorageChanged(callback: (changes: any) => void): void {
    if (this.isExtensionEnvironment()) {
      browser.storage.onChanged.addListener(callback);
    }
  }

  // 移除存储变化监听器
  removeStorageChangedListener(callback: (changes: any) => void): void {
    if (this.isExtensionEnvironment()) {
      browser.storage.onChanged.removeListener(callback);
    }
  }
}

export const storageService = new StorageService();