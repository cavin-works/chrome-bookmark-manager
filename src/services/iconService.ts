import { IconInfo } from '../utils/types';
import { ICON_CONFIG } from '../utils/constants';
import { getDomain, isValidUrl } from '../utils/helpers';
import { getDefaultIcon as getDefaultIconUtil } from '../utils/defaultIcon';

interface IconCache {
  [url: string]: {
    iconUrl: string;
    timestamp: number;
  };
}

class IconService {
  private cache: IconCache = {};
  private loadingPromises: Map<string, Promise<string>> = new Map(); // 避免重复请求

  // 获取书签图标（添加防重复请求机制）
  async getBookmarkIcon(url: string, size: number = ICON_CONFIG.DEFAULT_SIZE): Promise<string> {
    if (!url || !isValidUrl(url)) {
      return this.getDefaultIcon();
    }

    const cacheKey = `${url}_${size}`;

    // 检查缓存
    if (this.cache[cacheKey] && this.isCacheValid(this.cache[cacheKey].timestamp)) {
      console.log('从缓存获取图标:', url);
      return this.cache[cacheKey].iconUrl;
    }

    // 检查是否已有正在进行的请求
    if (this.loadingPromises.has(cacheKey)) {
      console.log('等待现有请求完成:', url);
      return this.loadingPromises.get(cacheKey)!;
    }

    // 创建新的加载Promise
    const loadingPromise = this.fetchIconWithFallback(url, size, cacheKey);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const iconUrl = await loadingPromise;
      return iconUrl;
    } finally {
      // 清理Promise引用
      this.loadingPromises.delete(cacheKey);
    }
  }

  // 内部方法：获取图标并处理失败情况
  private async fetchIconWithFallback(url: string, size: number, cacheKey: string): Promise<string> {
    try {
      const iconUrl = await this.fetchFavicon(url, size);

      // 缓存图标
      this.cache[cacheKey] = {
        iconUrl,
        timestamp: Date.now(),
      };

      return iconUrl;
    } catch (error: any) {
      console.warn('获取图标失败:', url, error?.message || error);

      // 尝试生成备用图标
      const domain = getDomain(url);
      if (domain) {
        const fallbackIcon = this.generateTextIcon(domain, size);

        // 缓存备用图标
        this.cache[cacheKey] = {
          iconUrl: fallbackIcon,
          timestamp: Date.now(),
        };

        console.log('使用文字图标作为备用:', domain);
        return fallbackIcon;
      }

      return this.getDefaultIcon();
    }
  }

  // 获取网站favicon
  private async fetchFavicon(url: string, size: number): Promise<string> {
    const domain = getDomain(url);
    if (!domain) {
      throw new Error('无效的域名');
    }

    // 优先使用Google服务，通常最可靠
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

    try {
      // 直接返回Google favicon服务的URL，因为它基本上总是可用的
      // 即使网站没有favicon，Google也会生成一个默认图标
      return googleFaviconUrl;
    } catch (error) {
      // 如果Google服务也失败，生成文字图标
      console.warn('Google favicon服务失败，使用文字图标:', domain);
      return this.generateTextIcon(domain, size);
    }
  }

  // 生成文字图标
  private generateTextIcon(text: string, size: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return this.getDefaultIcon();
    }

    // 设置背景
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, size, size);

    // 设置文字
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 获取首字母
    const firstChar = text.charAt(0).toUpperCase();
    ctx.fillText(firstChar, size / 2, size / 2);

    return canvas.toDataURL();
  }

  // 获取默认图标
  private getDefaultIcon(): string {
    return getDefaultIconUtil();
  }

  // 检查缓存是否有效
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < ICON_CONFIG.CACHE_EXPIRY;
  }

  // 清除缓存
  clearCache(): void {
    this.cache = {};
  }

  // 预加载图标
  async preloadIcons(urls: string[], size: number = ICON_CONFIG.DEFAULT_SIZE): Promise<void> {
    const promises = urls.map(url => this.getBookmarkIcon(url, size));
    await Promise.allSettled(promises);
  }

  // 获取图标信息
  getIconInfo(url: string, size: number = ICON_CONFIG.DEFAULT_SIZE): IconInfo {
    const cacheKey = `${url}_${size}`;
    const cached = this.cache[cacheKey];

    return {
      url: cached?.iconUrl || this.getDefaultIcon(),
      size,
      type: cached ? 'favicon' : 'default',
    };
  }

  // 批量获取图标（优化：控制并发数量，避免过多同时请求）
  async getBatchIcons(urls: string[], size: number = ICON_CONFIG.DEFAULT_SIZE): Promise<{ [url: string]: string }> {
    const results: { [url: string]: string } = {};

    // 过滤出需要加载的URL（未缓存的）
    const urlsToLoad = urls.filter(url => {
      const cacheKey = `${url}_${size}`;
      if (this.cache[cacheKey] && this.isCacheValid(this.cache[cacheKey].timestamp)) {
        // 已缓存，直接设置结果
        results[url] = this.cache[cacheKey].iconUrl;
        return false;
      }
      return true;
    });

    console.log(`批量加载图标: 总计 ${urls.length} 个，需要加载 ${urlsToLoad.length} 个`);

    if (urlsToLoad.length === 0) {
      return results;
    }

    // 分批处理，避免过多并发请求
    const batchSize = 5;
    for (let i = 0; i < urlsToLoad.length; i += batchSize) {
      const batch = urlsToLoad.slice(i, i + batchSize);

      const batchPromises = batch.map(async (url) => {
        try {
          const icon = await this.getBookmarkIcon(url, size);
          results[url] = icon;
        } catch (error) {
          console.warn('批量加载图标失败:', url, error);
          results[url] = this.getDefaultIcon();
        }
      });

      await Promise.all(batchPromises);

      // 批次间短暂延迟，避免过度占用资源
      if (i + batchSize < urlsToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('批量图标加载完成');
    return results;
  }
}

export const iconService = new IconService();