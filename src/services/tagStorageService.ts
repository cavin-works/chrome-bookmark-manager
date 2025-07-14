import type { Bookmark } from '@/utils/types';

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usage: number;
  createdAt: Date;
  lastUsed?: Date;
}

// 书签-标签关系
export interface BookmarkTagRelation {
  bookmarkId: string;
  tagId: string;
  assignedAt: Date;
}

// 存储键名常量
const STORAGE_KEYS = {
  TAGS: 'humi-tags',
  BOOKMARK_TAG_RELATIONS: 'humi-bookmark-tag-relations',
  TAG_COUNTER: 'humi-tag-counter'
} as const;

class TagStorageService {
  private tagCounter = 0;

  constructor() {
    this.initializeCounter();
  }

  // 初始化标签计数器
  private initializeCounter(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAG_COUNTER);
      this.tagCounter = saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.error('初始化标签计数器失败:', error);
      this.tagCounter = 0;
    }
  }

  // 生成新的标签ID
  private generateTagId(): string {
    this.tagCounter += 1;
    localStorage.setItem(STORAGE_KEYS.TAG_COUNTER, this.tagCounter.toString());
    return `tag_${this.tagCounter}`;
  }

  // 获取所有标签
  async getAllTags(): Promise<Tag[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (!stored) return [];

      const data = JSON.parse(stored);
      return data.map((tag: any) => ({
        ...tag,
        createdAt: new Date(tag.createdAt),
        lastUsed: tag.lastUsed ? new Date(tag.lastUsed) : undefined
      }));
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 保存标签
  async saveTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    try {
      // 标准化标签名称：去除首尾空格并转换为统一格式
      const normalizedName = tag.name.trim();
      
      if (!normalizedName) {
        throw new Error('标签名称不能为空');
      }
      
      const newTag: Tag = {
        ...tag,
        id: this.generateTagId(),
        name: normalizedName
      };

      const existingTags = await this.getAllTags();
      
      // 检查是否已存在同名标签（忽略大小写和空格）
      const existingTag = existingTags.find(t => 
        t.name.toLowerCase().trim() === normalizedName.toLowerCase()
      );
      
      if (existingTag) {
        throw new Error(`标签 "${normalizedName}" 已存在，不能创建重复标签`);
      }

      existingTags.push(newTag);
      await this.saveTags(existingTags);
      
      return newTag;
    } catch (error) {
      console.error('保存标签失败:', error);
      throw error;
    }
  }

  // 更新标签
  async updateTag(tagId: string, updates: Partial<Omit<Tag, 'id'>>): Promise<Tag> {
    try {
      const existingTags = await this.getAllTags();
      const tagIndex = existingTags.findIndex(t => t.id === tagId);
      
      if (tagIndex === -1) {
        throw new Error(`标签 ID "${tagId}" 不存在`);
      }

      // 如果更新名称，检查是否与其他标签重名
      if (updates.name) {
        const normalizedName = updates.name.trim();
        
        if (!normalizedName) {
          throw new Error('标签名称不能为空');
        }
        
        // 检查除当前标签外是否存在同名标签（忽略大小写和空格）
        const duplicateTag = existingTags.find(t => 
          t.id !== tagId && 
          t.name.toLowerCase().trim() === normalizedName.toLowerCase()
        );
        
        if (duplicateTag) {
          throw new Error(`标签 "${normalizedName}" 已存在，不能创建重复标签`);
        }
        
        // 标准化名称
        updates.name = normalizedName;
      }

      existingTags[tagIndex] = {
        ...existingTags[tagIndex],
        ...updates
      };

      await this.saveTags(existingTags);
      return existingTags[tagIndex];
    } catch (error) {
      console.error('更新标签失败:', error);
      throw error;
    }
  }

  // 删除标签
  async deleteTag(tagId: string): Promise<void> {
    try {
      const existingTags = await this.getAllTags();
      const filteredTags = existingTags.filter(t => t.id !== tagId);
      
      if (filteredTags.length === existingTags.length) {
        throw new Error(`标签 ID "${tagId}" 不存在`);
      }

      await this.saveTags(filteredTags);
      
      // 同时删除相关的书签-标签关系
      await this.removeAllRelationsForTag(tagId);
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }

  // 批量保存标签
  private async saveTags(tags: Tag[]): Promise<void> {
    try {
      const dataToSave = tags.map(tag => ({
        ...tag,
        createdAt: tag.createdAt.toISOString(),
        lastUsed: tag.lastUsed?.toISOString()
      }));
      
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存标签数据失败:', error);
      throw error;
    }
  }

  // 获取所有书签-标签关系
  async getAllRelations(): Promise<BookmarkTagRelation[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARK_TAG_RELATIONS);
      if (!stored) return [];

      const data = JSON.parse(stored);
      return data.map((relation: any) => ({
        ...relation,
        assignedAt: new Date(relation.assignedAt)
      }));
    } catch (error) {
      console.error('获取书签-标签关系失败:', error);
      return [];
    }
  }

  // 为书签分配标签
  async assignTagsToBookmark(bookmarkId: string, tagIds: string[]): Promise<void> {
    try {
      const existingRelations = await this.getAllRelations();
      
      // 移除该书签的所有现有标签关系
      const filteredRelations = existingRelations.filter(r => r.bookmarkId !== bookmarkId);
      
      // 添加新的标签关系
      const newRelations: BookmarkTagRelation[] = tagIds.map(tagId => ({
        bookmarkId,
        tagId,
        assignedAt: new Date()
      }));

      const allRelations = [...filteredRelations, ...newRelations];
      await this.saveRelations(allRelations);

      // 更新标签使用计数
      await this.updateTagUsage(tagIds);
    } catch (error) {
      console.error('分配标签失败:', error);
      throw error;
    }
  }

  // 获取书签的标签
  async getTagsForBookmark(bookmarkId: string): Promise<Tag[]> {
    try {
      const relations = await this.getAllRelations();
      const tags = await this.getAllTags();
      
      const bookmarkRelations = relations.filter(r => r.bookmarkId === bookmarkId);
      const bookmarkTags = bookmarkRelations
        .map(relation => tags.find(tag => tag.id === relation.tagId))
        .filter((tag): tag is Tag => tag !== undefined);

      return bookmarkTags;
    } catch (error) {
      console.error('获取书签标签失败:', error);
      return [];
    }
  }

  // 获取标签下的所有书签ID
  async getBookmarksForTag(tagId: string): Promise<string[]> {
    try {
      const relations = await this.getAllRelations();
      return relations
        .filter(r => r.tagId === tagId)
        .map(r => r.bookmarkId);
    } catch (error) {
      console.error('获取标签书签失败:', error);
      return [];
    }
  }

  // 移除书签的特定标签
  async removeTagFromBookmark(bookmarkId: string, tagId: string): Promise<void> {
    try {
      const relations = await this.getAllRelations();
      const filteredRelations = relations.filter(
        r => !(r.bookmarkId === bookmarkId && r.tagId === tagId)
      );
      
      await this.saveRelations(filteredRelations);
    } catch (error) {
      console.error('移除书签标签失败:', error);
      throw error;
    }
  }

  // 移除标签的所有关系
  private async removeAllRelationsForTag(tagId: string): Promise<void> {
    try {
      const relations = await this.getAllRelations();
      const filteredRelations = relations.filter(r => r.tagId !== tagId);
      await this.saveRelations(filteredRelations);
    } catch (error) {
      console.error('移除标签关系失败:', error);
      throw error;
    }
  }

  // 保存关系数据
  private async saveRelations(relations: BookmarkTagRelation[]): Promise<void> {
    try {
      const dataToSave = relations.map(relation => ({
        ...relation,
        assignedAt: relation.assignedAt.toISOString()
      }));
      
      localStorage.setItem(STORAGE_KEYS.BOOKMARK_TAG_RELATIONS, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存关系数据失败:', error);
      throw error;
    }
  }

  // 更新标签使用计数
  private async updateTagUsage(tagIds: string[]): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const relations = await this.getAllRelations();

      // 重新计算每个标签的使用次数
      const updatedTags = tags.map(tag => {
        const usageCount = relations.filter(r => r.tagId === tag.id).length;
        const hasUsage = usageCount > 0;
        
        return {
          ...tag,
          usage: usageCount,
          lastUsed: hasUsage ? new Date() : tag.lastUsed
        };
      });

      await this.saveTags(updatedTags);
    } catch (error) {
      console.error('更新标签使用计数失败:', error);
      throw error;
    }
  }

  // 批量分配标签（AI整理功能使用）
  async batchAssignTags(assignments: { [bookmarkId: string]: string[] }): Promise<void> {
    try {
      const existingRelations = await this.getAllRelations();
      const assignedBookmarkIds = Object.keys(assignments);
      
      // 移除已分配书签的现有关系
      const filteredRelations = existingRelations.filter(
        r => !assignedBookmarkIds.includes(r.bookmarkId)
      );

      // 创建新的关系
      const newRelations: BookmarkTagRelation[] = [];
      Object.entries(assignments).forEach(([bookmarkId, tagIds]) => {
        tagIds.forEach(tagId => {
          newRelations.push({
            bookmarkId,
            tagId,
            assignedAt: new Date()
          });
        });
      });

      const allRelations = [...filteredRelations, ...newRelations];
      await this.saveRelations(allRelations);

      // 更新所有标签的使用计数
      const allTagIds = new Set<string>();
      Object.values(assignments).forEach(tagIds => {
        tagIds.forEach(tagId => allTagIds.add(tagId));
      });
      
      await this.updateTagUsage(Array.from(allTagIds));
    } catch (error) {
      console.error('批量分配标签失败:', error);
      throw error;
    }
  }

  // 获取标签统计信息
  async getTagStatistics(): Promise<{
    totalTags: number;
    totalRelations: number;
    popularTags: Tag[];
    unusedTags: Tag[];
  }> {
    try {
      const tags = await this.getAllTags();
      const relations = await this.getAllRelations();

      const popularTags = tags
        .filter(tag => tag.usage >= 5)
        .sort((a, b) => b.usage - a.usage);

      const unusedTags = tags.filter(tag => tag.usage === 0);

      return {
        totalTags: tags.length,
        totalRelations: relations.length,
        popularTags,
        unusedTags
      };
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return {
        totalTags: 0,
        totalRelations: 0,
        popularTags: [],
        unusedTags: []
      };
    }
  }

  // 清空所有数据（重置功能）
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.TAGS);
      localStorage.removeItem(STORAGE_KEYS.BOOKMARK_TAG_RELATIONS);
      localStorage.removeItem(STORAGE_KEYS.TAG_COUNTER);
      this.tagCounter = 0;
    } catch (error) {
      console.error('清空数据失败:', error);
      throw error;
    }
  }

  // 批量去重现有标签（数据修复工具）
  async deduplicateTags(): Promise<{ removedCount: number; mergedRelations: number }> {
    try {
      const existingTags = await this.getAllTags();
      const relations = await this.getAllRelations();
      
      // 按标准化名称分组
      const tagGroups = new Map<string, Tag[]>();
      existingTags.forEach(tag => {
        const normalizedName = tag.name.toLowerCase().trim();
        if (!tagGroups.has(normalizedName)) {
          tagGroups.set(normalizedName, []);
        }
        tagGroups.get(normalizedName)!.push(tag);
      });
      
      const uniqueTags: Tag[] = [];
      const tagIdMapping = new Map<string, string>(); // 旧ID -> 新ID
      let removedCount = 0;
      let mergedRelations = 0;
      
      // 处理每个标签组
      tagGroups.forEach((duplicateTags, normalizedName) => {
        if (duplicateTags.length === 1) {
          // 没有重复，直接保留
          uniqueTags.push(duplicateTags[0]);
          tagIdMapping.set(duplicateTags[0].id, duplicateTags[0].id);
        } else {
          // 有重复，合并为一个标签
          const keepTag = duplicateTags.reduce((best, current) => {
            // 选择使用次数最多的，如果相同则选择最早创建的
            if (current.usage > best.usage) return current;
            if (current.usage === best.usage && current.createdAt < best.createdAt) return current;
            return best;
          });
          
          // 使用标准化名称
          keepTag.name = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
          
          uniqueTags.push(keepTag);
          
          // 记录所有重复标签ID到保留标签ID的映射
          duplicateTags.forEach(tag => {
            tagIdMapping.set(tag.id, keepTag.id);
            if (tag.id !== keepTag.id) {
              removedCount++;
            }
          });
        }
      });
      
      // 更新关系数据，将重复标签的关系合并到保留的标签
      const updatedRelations: BookmarkTagRelation[] = [];
      const relationSet = new Set<string>(); // 用于去重关系
      
      relations.forEach(relation => {
        const newTagId = tagIdMapping.get(relation.tagId);
        if (newTagId) {
          const relationKey = `${relation.bookmarkId}-${newTagId}`;
          if (!relationSet.has(relationKey)) {
            updatedRelations.push({
              ...relation,
              tagId: newTagId
            });
            relationSet.add(relationKey);
          } else {
            mergedRelations++;
          }
        }
      });
      
      // 保存去重后的数据
      await this.saveTags(uniqueTags);
      await this.saveRelations(updatedRelations);
      
      // 重新计算使用次数
      await this.updateTagUsage([]);
      
      return { removedCount, mergedRelations };
    } catch (error) {
      console.error('去重标签失败:', error);
      throw error;
    }
  }

  // 批量创建标签（带去重）
  async createTagsBatch(tagNames: string[]): Promise<{ created: Tag[]; skipped: string[] }> {
    try {
      const existingTags = await this.getAllTags();
      const existingNames = new Set(
        existingTags.map(t => t.name.toLowerCase().trim())
      );
      
      const created: Tag[] = [];
      const skipped: string[] = [];
      
      for (const tagName of tagNames) {
        const normalizedName = tagName.trim();
        if (!normalizedName) continue;
        
        if (existingNames.has(normalizedName.toLowerCase())) {
          skipped.push(normalizedName);
        } else {
          try {
            const newTag = await this.saveTag({
              name: normalizedName,
              color: this.getRandomColor(),
              description: 'AI 生成的标签',
              usage: 0,
              createdAt: new Date()
            });
            created.push(newTag);
            existingNames.add(normalizedName.toLowerCase());
          } catch (error) {
            // 如果保存失败（比如并发创建导致重复），跳过
            skipped.push(normalizedName);
          }
        }
      }
      
      return { created, skipped };
    } catch (error) {
      console.error('批量创建标签失败:', error);
      throw error;
    }
  }

  // 获取随机颜色
  private getRandomColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
      '#f97316', '#6366f1', '#14b8a6', '#e11d48'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 导出数据
  async exportData(): Promise<{
    tags: Tag[];
    relations: BookmarkTagRelation[];
    exportedAt: string;
  }> {
    try {
      const tags = await this.getAllTags();
      const relations = await this.getAllRelations();

      return {
        tags,
        relations,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      throw error;
    }
  }

  // 导入数据
  async importData(data: {
    tags: Tag[];
    relations: BookmarkTagRelation[];
  }): Promise<void> {
    try {
      await this.saveTags(data.tags);
      await this.saveRelations(data.relations);
      
      // 更新计数器
      const maxId = data.tags.reduce((max, tag) => {
        const idNum = parseInt(tag.id.replace('tag_', ''), 10);
        return idNum > max ? idNum : max;
      }, 0);
      
      this.tagCounter = maxId;
      localStorage.setItem(STORAGE_KEYS.TAG_COUNTER, this.tagCounter.toString());
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }
}

export const tagStorageService = new TagStorageService();