import { AICategoryResult, Bookmark } from '../utils/types';
import { AI_CONFIG } from '../utils/constants';

class AIService {
  private apiKey?: string;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-3.5-turbo';

  // 设置API密钥
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // 设置API基础URL
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // 移除尾部斜杠
  }

  // 设置模型
  setModel(model: string): void {
    this.model = model;
  }

  // 获取API密钥
  getApiKey(): string | undefined {
    return this.apiKey;
  }

  // 获取API基础URL
  getBaseUrl(): string {
    return this.baseUrl;
  }

  // 获取当前模型
  getModel(): string {
    return this.model;
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

    const chatCompletionsUrl = `${this.baseUrl}/chat/completions`;

    const response = await fetch(chatCompletionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
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

      const chatCompletionsUrl = `${this.baseUrl}/chat/completions`;

      const response = await fetch(chatCompletionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
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

  // 基于书签生成推荐标签
  async generateTagsFromBookmarks(bookmarks: Bookmark[], existingTags: string[] = []): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置');
    }

    try {
      const prompt = this.buildTagGenerationPrompt(bookmarks, existingTags);
      const response = await this.callOpenAI(prompt);
      return this.parseTagGenerationResponse(response);
    } catch (error) {
      console.error('AI标签生成失败:', error);
      return this.getDefaultTags(bookmarks);
    }
  }

  // 构建标签生成提示词
  private buildTagGenerationPrompt(bookmarks: Bookmark[], existingTags: string[]): string {
    // 限制书签数量，避免prompt过长
    const sampleBookmarks = bookmarks.slice(0, 20);
    const bookmarkInfo = sampleBookmarks.map((bookmark, index) =>
      `${index + 1}. 标题: ${bookmark.title}\n   URL: ${bookmark.url || '无'}\n   描述: ${bookmark.description || '无'}`
    ).join('\n\n');

    const existingTagsText = existingTags.length > 0 ? `\n\n已存在的标签（请避免重复）: ${existingTags.join(', ')}` : '';

    return `## Role: 信息分类专家和标签生成顾问

## Background: 
用户需要对书签进行有效的分类和管理，通过提供书签的具体信息，期望得到精准且符合内容的标签，以便快速检索和整理书签。

## Profile: 
你是一位精通信息分类和标签管理的专家，能够从复杂的文本信息中提炼关键要素，生成精准且实用的标签，帮助用户高效管理信息资源。

## Skills: 
你具备强大的文本分析能力、信息分类技巧以及对不同领域知识的广泛了解，能够快速识别书签内容的核心主题和相关要素。

## Goals: 
根据用户提供的书签信息，生成精准且符合内容的标签，帮助用户更好地管理和检索书签。

## Constrains: 
- 标签应简洁明了，具有代表性，避免冗余和模糊性
- 确保每个标签都能准确反映书签的核心内容
- 优先使用2-4个中文字符的标签
- 避免过于技术化的术语（如"React"改为"前端"）
- 避免过于具体的品牌名（如"GitHub"改为"代码"）

## OutputFormat: 
以JSON数组形式返回标签，格式为：["标签1", "标签2", "标签3", ...]

## Workflow:
1. 仔细阅读和分析用户提供的书签信息，提取关键主题和要素
2. 根据提取的关键信息，生成精准且具有代表性的标签
3. 对生成的标签进行审核和优化，确保其简洁明了且无冗余

## 书签信息:
${bookmarkInfo}${existingTagsText}

## Examples:
- 例子1：书签信息："一篇关于人工智能在医疗领域的应用的学术论文，探讨了AI如何帮助医生进行疾病诊断和治疗方案的制定。"
  返回标签：["人工智能", "医疗", "疾病诊断", "治疗方案", "学术论文"]
- 例子2：书签信息："一个旅游博客，介绍了日本京都的美食、景点和文化活动。"
  返回标签：["旅游", "日本", "京都", "美食", "景点", "文化活动"]
- 例子3：书签信息："一个关于Python编程语言的在线教程，适合初学者学习基础语法和数据结构。"
  返回标签：["Python", "编程语言", "初学者", "基础语法", "数据结构", "在线教程"]

请基于以上书签信息，生成8-12个最适合这些书签的标签，以JSON数组格式返回。`;
  }

  // 解析标签生成响应
  private parseTagGenerationResponse(response: string): string[] {
    try {
      // 尝试提取JSON数组
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return this.deduplicateAndNormalizeTags(parsed)
            .slice(0, 15); // 限制最大数量
        }
      }

      // 如果JSON解析失败，尝试提取引号包围的标签
      const tagMatches = response.match(/"([^"]+)"/g);
      if (tagMatches) {
        const tags = tagMatches
          .map(match => match.replace(/"/g, '').trim())
          .filter(tag => tag.length > 0);
        return this.deduplicateAndNormalizeTags(tags)
          .slice(0, 15);
      }
    } catch (error) {
      console.error('解析AI标签响应失败:', error);
    }

    return this.getDefaultTags();
  }

  // 去重和标准化标签
  private deduplicateAndNormalizeTags(tags: string[]): string[] {
    const normalizedTags = new Map<string, string>(); // 小写键 -> 原始值
    
    tags.forEach(tag => {
      if (typeof tag === 'string') {
        const trimmed = tag.trim();
        if (trimmed.length > 0) {
          const lowerKey = trimmed.toLowerCase();
          if (!normalizedTags.has(lowerKey)) {
            normalizedTags.set(lowerKey, trimmed);
          }
        }
      }
    });
    
    return Array.from(normalizedTags.values());
  }

  // 获取默认标签（基于规则）
  private getDefaultTags(bookmarks: Bookmark[] = []): string[] {
    const defaultTags = ['工具', '学习', '开发', '设计', '文档', '资源', '社区', '新闻'];

    if (bookmarks.length === 0) {
      return defaultTags.slice(0, 8);
    }

    // 基于书签内容生成一些基础标签
    const allText = bookmarks.map(b => `${b.title} ${b.url || ''} ${b.description || ''}`).join(' ').toLowerCase();
    const generatedTags: string[] = [];

    const tagRules = [
      { keywords: ['github', 'git', '代码', 'code', 'repo'], tag: '开源' },
      { keywords: ['vue', 'react', 'angular', '前端', 'frontend', 'web'], tag: '前端' },
      { keywords: ['backend', '后端', 'server', 'api'], tag: '后端' },
      { keywords: ['doc', '文档', 'docs', 'manual'], tag: '文档' },
      { keywords: ['tool', '工具', 'online', 'converter'], tag: '工具' },
      { keywords: ['blog', '博客'], tag: '博客' },
      { keywords: ['design', '设计', 'ui', 'ux'], tag: '设计' },
      { keywords: ['tutorial', '教程', '学习', 'course'], tag: '学习' },
      { keywords: ['news', '新闻', '资讯'], tag: '新闻' },
      { keywords: ['community', '社区', 'forum'], tag: '社区' },
      { keywords: ['reference', '参考', 'spec'], tag: '参考' },
      { keywords: ['entertainment', '娱乐', 'game', '游戏'], tag: '娱乐' },
    ];

    tagRules.forEach(rule => {
      if (rule.keywords.some(keyword => allText.includes(keyword))) {
        generatedTags.push(rule.tag);
      }
    });

    return [...generatedTags, ...defaultTags].slice(0, 10);
  }

  // 批量整理书签标签（支持分批处理）
  async organizeBookmarksWithTags(
    bookmarks: Bookmark[], 
    existingTags: string[],
    options?: {
      batchSize?: number;
      onProgress?: (processed: number, total: number, currentBatch: number) => void;
    }
  ): Promise<{
    assignments: { [bookmarkId: string]: string[] };
    newTags: string[];
  }> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置');
    }

    const { batchSize = 30, onProgress } = options || {};
    const totalBookmarks = bookmarks.length;

    // 如果书签数量少于批处理大小，直接处理
    if (totalBookmarks <= batchSize) {
      try {
        const prompt = this.buildOrganizePrompt(bookmarks, existingTags);
        const response = await this.callOpenAI(prompt);
        const result = this.parseOrganizeResponse(response, bookmarks);
        
        if (onProgress) {
          onProgress(totalBookmarks, totalBookmarks, 1);
        }
        
        return result;
      } catch (error) {
        console.error('AI整理书签失败:', error);
        // 提供基于规则的降级方案
        return this.organizeByRules(bookmarks, existingTags);
      }
    }

    // 分批处理大量书签
    console.log(`书签数量较多(${totalBookmarks}个)，将分批处理，每批${batchSize}个`);
    
    const mergedAssignments: { [bookmarkId: string]: string[] } = {};
    const allNewTags = new Set<string>();
    let processedCount = 0;
    
    // 计算批次数
    const totalBatches = Math.ceil(totalBookmarks / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalBookmarks);
      const batch = bookmarks.slice(startIndex, endIndex);
      
      console.log(`处理第 ${i + 1}/${totalBatches} 批，书签范围: ${startIndex + 1}-${endIndex}`);
      
      try {
        // 更新现有标签列表（包含前面批次推荐的新标签）
        const currentExistingTags = [...existingTags, ...Array.from(allNewTags)];
        
        const prompt = this.buildOrganizePrompt(batch, currentExistingTags);
        const response = await this.callOpenAI(prompt);
        const batchResult = this.parseOrganizeResponse(response, batch);
        
        // 合并分配结果
        Object.assign(mergedAssignments, batchResult.assignments);
        
        // 收集新标签（避免重复）
        batchResult.newTags.forEach(tag => {
          if (!existingTags.includes(tag)) {
            allNewTags.add(tag);
          }
        });
        
        processedCount += batch.length;
        
        // 调用进度回调
        if (onProgress) {
          onProgress(processedCount, totalBookmarks, i + 1);
        }
        
        // 批次间稍微延迟，避免API限制
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`第 ${i + 1} 批次处理失败:`, error);
        
        // 对失败的批次使用规则方案
        const fallbackResult = this.organizeByRules(batch, existingTags);
        Object.assign(mergedAssignments, fallbackResult.assignments);
        fallbackResult.newTags.forEach(tag => {
          if (!existingTags.includes(tag)) {
            allNewTags.add(tag);
          }
        });
        
        processedCount += batch.length;
        
        if (onProgress) {
          onProgress(processedCount, totalBookmarks, i + 1);
        }
      }
    }
    
    console.log(`分批处理完成，共处理 ${processedCount} 个书签，生成 ${allNewTags.size} 个新标签`);
    
    return {
      assignments: mergedAssignments,
      newTags: Array.from(allNewTags)
    };
  }

  // 构建整理提示词
  private buildOrganizePrompt(bookmarks: Bookmark[], existingTags: string[]): string {
    // 限制书签数量，避免prompt过长
    const sampleBookmarks = bookmarks.slice(0, 30);
    const bookmarkInfo = sampleBookmarks.map((bookmark, index) =>
      `${index + 1}. ID: ${bookmark.id}, 标题: ${bookmark.title}, URL: ${bookmark.url || '无'}, 描述: ${bookmark.description || '无'}`
    ).join('\n');

    const existingTagsText = existingTags.length > 0 ? existingTags.join(', ') : '无';

    return `您是一个专业的书签管理助手。请为以下书签分配合适的标签，重点关注实用性和书签检索便利性。

书签列表:
${bookmarkInfo}

现有标签: ${existingTagsText}

书签标签整理原则:
1. **实用导向**: 标签要能帮助用户在需要时快速找到相关书签
2. **场景化分类**: 根据用户使用场景进行分类
   - 工作场景: "工作"、"会议"、"项目"、"报告"
   - 学习成长: "学习"、"教程"、"课程"、"参考"
   - 技术开发: "开发"、"工具"、"文档"、"代码"
   - 日常使用: "购物"、"娱乐"、"新闻"、"社交"

3. **优先级规则**:
   - 优先使用现有标签，保持标签体系一致性
   - 每个书签分配1-3个标签，避免标签冗余
   - 新标签必须是通用性强、复用率高的分类

4. **标签命名规范**:
   - 长度: 2-4个中文字符
   - 避免品牌名称（如"GitHub"改为"代码"）
   - 避免技术术语（如"React"改为"前端"）
   - 优先选择用户日常会搜索的词汇

5. **分类维度建议**:
   - 用途维度: 工作、学习、娱乐、购物、工具
   - 内容维度: 文档、教程、新闻、视频、图片
   - 技术维度: 前端、后端、设计、数据、运维
   - 频率维度: 常用、收藏、临时、备用

请以JSON格式返回标签分配结果：
{
  "assignments": {
    "书签ID": ["标签1", "标签2"],
    "书签ID": ["标签1"]
  },
  "newTags": ["新标签1", "新标签2"]
}

整理示例：
{
  "assignments": {
    "1": ["工具", "开发"],
    "2": ["学习", "文档"],
    "3": ["设计", "参考"]
  },
  "newTags": ["API", "在线"]
}`;
  }

  // 解析整理响应
  private parseOrganizeResponse(response: string, bookmarks: Bookmark[]): {
    assignments: { [bookmarkId: string]: string[] };
    newTags: string[];
  } {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const assignments: { [bookmarkId: string]: string[] } = {};
        const newTags: string[] = [];

        // 处理分配结果
        if (parsed.assignments && typeof parsed.assignments === 'object') {
          Object.keys(parsed.assignments).forEach(bookmarkId => {
            const tags = parsed.assignments[bookmarkId];
            if (Array.isArray(tags)) {
              assignments[bookmarkId] = tags.slice(0, 3); // 限制每个书签最多3个标签
            }
          });
        }

        // 处理新标签
        if (Array.isArray(parsed.newTags)) {
          newTags.push(...parsed.newTags.slice(0, 5)); // 限制新标签数量
        }

        return { assignments, newTags };
      }
    } catch (error) {
      console.error('解析AI整理响应失败:', error);
    }

    // 降级到规则整理
    return this.organizeByRules(bookmarks);
  }

  // 基于规则的整理（降级方案）
  private organizeByRules(bookmarks: Bookmark[], existingTags: string[] = []): {
    assignments: { [bookmarkId: string]: string[] };
    newTags: string[];
  } {
    const assignments: { [bookmarkId: string]: string[] } = {};
    const newTagsSet = new Set<string>();

    const tagRules = [
      { keywords: ['github', 'git', '代码', 'code', 'repo'], tags: ['开源', '开发'] },
      { keywords: ['vue', 'react', 'angular', '前端', 'frontend', 'web'], tags: ['前端', '开发'] },
      { keywords: ['backend', '后端', 'server', 'api'], tags: ['后端', '开发'] },
      { keywords: ['doc', '文档', 'docs', 'manual'], tags: ['文档', '参考'] },
      { keywords: ['tool', '工具', 'online', 'converter'], tags: ['工具'] },
      { keywords: ['blog', '博客'], tags: ['博客', '学习'] },
      { keywords: ['design', '设计', 'ui', 'ux'], tags: ['设计'] },
      { keywords: ['tutorial', '教程', '学习', 'course'], tags: ['学习', '教程'] },
      { keywords: ['news', '新闻', '资讯'], tags: ['新闻'] },
      { keywords: ['community', '社区', 'forum'], tags: ['社区'] },
      { keywords: ['reference', '参考', 'spec'], tags: ['参考', '文档'] },
      { keywords: ['entertainment', '娱乐', 'game', '游戏'], tags: ['娱乐'] },
    ];

    bookmarks.forEach(bookmark => {
      const text = `${bookmark.title} ${bookmark.url || ''} ${bookmark.description || ''}`.toLowerCase();
      const assignedTags: string[] = [];

      // 匹配规则
      tagRules.forEach(rule => {
        if (rule.keywords.some(keyword => text.includes(keyword))) {
          rule.tags.forEach(tag => {
            if (existingTags.includes(tag)) {
              // 使用现有标签
              if (!assignedTags.includes(tag)) {
                assignedTags.push(tag);
              }
            } else {
              // 推荐新标签
              newTagsSet.add(tag);
              if (!assignedTags.includes(tag)) {
                assignedTags.push(tag);
              }
            }
          });
        }
      });

      // 如果没有匹配到任何标签，分配通用标签
      if (assignedTags.length === 0) {
        const defaultTag = existingTags.includes('其他') ? '其他' : '未分类';
        assignedTags.push(defaultTag);
        if (!existingTags.includes(defaultTag)) {
          newTagsSet.add(defaultTag);
        }
      }

      assignments[bookmark.id] = assignedTags.slice(0, 3);
    });

    return {
      assignments,
      newTags: Array.from(newTagsSet).slice(0, 5)
    };
  }

  // 获取分类建议
  getCategorySuggestions(): readonly string[] {
    return AI_CONFIG.DEFAULT_CATEGORIES;
  }
}

export const aiService = new AIService();