import { AICategoryResult, Bookmark } from '../utils/types';
import { AI_CONFIG } from '../utils/constants';

class AIService {
  private apiKey?: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  // 设置API密钥
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // 获取API密钥
  getApiKey(): string | undefined {
    return this.apiKey;
  }

  // 分析书签并分类
  async categorizeBookmark(bookmark: Bookmark): Promise<AICategoryResult> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置');
    }

    try {
      const prompt = this.buildCategorizationPrompt(bookmark);
      const response = await this.callOpenAI(prompt);

      return this.parseCategorizationResponse(response);
    } catch (error) {
      console.error('AI分类失败:', error);
      return this.getDefaultCategory();
    }
  }

  // 批量分类书签
  async categorizeBookmarks(bookmarks: Bookmark[]): Promise<{ [id: string]: AICategoryResult }> {
    const results: { [id: string]: AICategoryResult } = {};

    // 限制并发请求数量
    const batchSize = 5;
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      const batchPromises = batch.map(async (bookmark) => {
        try {
          const result = await this.categorizeBookmark(bookmark);
          results[bookmark.id] = result;
        } catch (error) {
          results[bookmark.id] = this.getDefaultCategory();
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  // 构建分类提示词
  private buildCategorizationPrompt(bookmark: Bookmark): string {
    const categories = AI_CONFIG.DEFAULT_CATEGORIES.join('、');

    return `请分析以下书签信息，并将其分类到最合适的类别中。

书签信息：
- 标题：${bookmark.title}
- URL：${bookmark.url || '无'}
- 描述：${bookmark.description || '无'}

可选分类：${categories}

请以JSON格式返回结果，包含以下字段：
- category: 分类名称（从上述分类中选择）
- confidence: 置信度（0-1之间的数字）
- tags: 相关标签数组（最多${AI_CONFIG.MAX_TAGS}个）
- description: 简短描述（可选）

示例格式：
{
  "category": "技术",
  "confidence": 0.85,
  "tags": ["编程", "开发", "教程"],
  "description": "技术相关的编程教程网站"
}`;
  }

  // 调用OpenAI API
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // 解析分类响应
  private parseCategorizationResponse(response: string): AICategoryResult {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          category: parsed.category || '其他',
          confidence: Math.min(Math.max(parsed.confidence || 0, 0), 1),
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, AI_CONFIG.MAX_TAGS) : [],
          description: parsed.description || '',
        };
      }
    } catch (error) {
      console.error('解析AI响应失败:', error);
    }

    return this.getDefaultCategory();
  }

  // 获取默认分类
  private getDefaultCategory(): AICategoryResult {
    return {
      category: '其他',
      confidence: 0.5,
      tags: [],
      description: '',
    };
  }

  // 基于规则的简单分类（备用方案）
  categorizeByRules(bookmark: Bookmark): AICategoryResult {
    const title = bookmark.title.toLowerCase();
    const url = bookmark.url?.toLowerCase() || '';
    const description = bookmark.description?.toLowerCase() || '';

    const text = `${title} ${url} ${description}`;

    // 定义分类规则
    const rules = [
      { category: '工作', keywords: ['工作', 'office', '企业', '公司', '职场'] },
      { category: '学习', keywords: ['学习', 'study', '教育', '课程', '教程', '知识'] },
      { category: '娱乐', keywords: ['娱乐', '游戏', '电影', '音乐', '视频', 'fun'] },
      { category: '购物', keywords: ['购物', 'shop', 'buy', '购买', '商城', '电商'] },
      { category: '新闻', keywords: ['新闻', 'news', '资讯', '报道', '时事'] },
      { category: '技术', keywords: ['技术', 'tech', '编程', '开发', '代码', 'github'] },
      { category: '生活', keywords: ['生活', 'life', '健康', '美食', '旅游', '生活'] },
      { category: '工具', keywords: ['工具', 'tool', '在线', '转换', '计算'] },
      { category: '社交', keywords: ['社交', 'social', '微博', '微信', 'qq', '聊天'] },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => text.includes(keyword))) {
        return {
          category: rule.category,
          confidence: 0.7,
          tags: rule.keywords.slice(0, 3),
          description: `基于关键词匹配的${rule.category}分类`,
        };
      }
    }

    return this.getDefaultCategory();
  }

  // 验证API密钥
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const originalKey = this.apiKey;
      this.apiKey = apiKey;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });

      this.apiKey = originalKey;
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 获取分类建议
  getCategorySuggestions(): string[] {
    return AI_CONFIG.DEFAULT_CATEGORIES;
  }

  // 添加自定义分类
  addCustomCategory(category: string): void {
    if (!AI_CONFIG.DEFAULT_CATEGORIES.includes(category)) {
      AI_CONFIG.DEFAULT_CATEGORIES.push(category);
    }
  }
}

export const aiService = new AIService();