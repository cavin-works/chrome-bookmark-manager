class AIService {
    constructor(apiKey, provider = 'openai', baseUrl = '') {
        this.apiKey = apiKey;
        this.provider = provider;
        this.baseUrl = baseUrl.trim();  // 确保去除空格
        this.model = 'gpt-4o';  // 保持使用 gpt-4o 模型
    }

    setModel(model) {
        this.model = model;
    }

    // 调用 AI 服务的核心方法
    async callAI(prompt) {
        // 如果设置了代理地址，需要确保它是完整的 API 路径
        let url = this.baseUrl || 'https://api.openai.com/v1/chat/completions';
        if (this.baseUrl && !this.baseUrl.endsWith('/v1/chat/completions')) {
            url = this.baseUrl.replace(/\/?$/, '/v1/chat/completions');
        }
        
        try {
            // 验证 URL 格式
            try {
                new URL(url);
            } catch (e) {
                throw new Error('API地址格式无效，完整地址应该类似：https://your-proxy.com/v1/chat/completions');
            }

            // 添加 API 密钥和 URL 的日志打印
            const maskedApiKey = this.apiKey.slice(0, 4) + '*'.repeat(this.apiKey.length - 8) + this.apiKey.slice(-4);
            console.log('API配置信息:', {
                apiKey: maskedApiKey,
                url: url
            });

            console.log('正在调用AI服务...', {
                url,
                model: this.model,
                provider: this.provider
            });

            const requestBody = {
                model: this.model,
                messages: [
                    {
                        "role": "system",
                        "content": "你是一个书签分析助手。请始终返回有效的JSON格式数据。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format: { "type": "json_object" },
                temperature: 0.3,
                max_tokens: 4096
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const contentType = response.headers.get('content-type');
            console.log('响应状态:', response.status, '响应类型:', contentType);

            // 获取原始响应文本
            const responseText = await response.text();
            console.log('原始响应内容:', responseText);

            // 检查响应类型和内容
            if (responseText.includes('<!doctype html>') || responseText.includes('<html>')) {
                console.error('收到HTML响应:', responseText.substring(0, 200));
                throw new Error('代理服务器配置错误。请确保：\n1. 代理地址正确（应以/v1/chat/completions结尾）\n2. 代理服务器正确转发请求到OpenAI');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON解析失败:', e);
                throw new Error('API响应格式错误。请检查代理服务器配置是否正确转发了OpenAI的响应');
            }

            if (!response.ok) {
                if (data.error?.message?.includes('model')) {
                    throw new Error(`模型错误: ${this.model}。请联系管理员确认支持的模型`);
                }
                throw new Error(data.error?.message || '调用AI服务失败');
            }

            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('AI响应缺少必要内容');
            }

            // 验证返回的内容是否为有效的JSON
            try {
                const parsedContent = JSON.parse(content);
                console.log('解析后的AI返回内容:', parsedContent);
                return content;
            } catch (e) {
                console.error('AI返回的内容不是有效的JSON:', content);
                throw new Error('AI返回的内容格式错误，请重试');
            }

        } catch (error) {
            console.error('AI服务调用失败:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('无法连接到AI服务。请检查：\n1. 网络连接是否正常\n2. 代理地址是否正确\n3. 代理服务器是否在线');
            }
            throw error;
        }
    }

    // 分析单个网页并推荐目录
    async analyzePage(pageInfo, existingFolders) {
        const prompt = `请分析以下网页信息并推荐合适的书签目录。请确保返回的是有效的JSON格式。
            
            当前已存在的文件夹结构：
            ${JSON.stringify(existingFolders, null, 2)}
            
            网页信息：
            标题：${pageInfo.title}
            URL：${pageInfo.url}
            描述：${pageInfo.description}
            
            请严格按照以下JSON格式返回：
            {
                "useExisting": true或false,
                "existingPath": "现有文件夹的完整路径",
                "newPath": "新建文件夹的完整路径",
                "reason": "推荐理由"
            }`;

        return await this.callAI(prompt);
    }

    // 分析整个书签树并提供重组方案
    async analyzeBookmarkTree(bookmarks) {
        const prompt = `请分析并重新组织以下书签树。请确保返回的是有效的JSON格式。
            
            请严格按照以下JSON格式返回：
            {
                "directories": [
                    {
                        "name": "目录名称",
                        "bookmarks": [
                            {
                                "title": "书签标题",
                                "url": "书签URL",
                                "originalId": "原ID"
                            }
                        ]
                    }
                ]
            }
            
            以下是需要整理的书签：
            ${JSON.stringify(bookmarks, null, 2)}`;

        return await this.callAI(prompt);
    }

    // 批量分析网页并推荐目录
    async analyzeBatchPages(pages, existingFolders) {
        const prompt = `请分析以下多个网页信息，并为每个网页推荐最合适的现有书签目录。请确保返回的是有效的JSON格式。
            
            当前已存在的文件夹结构：
            ${JSON.stringify(existingFolders, null, 2)}
            
            需要分类的网页列表：
            ${JSON.stringify(pages, null, 2)}
            
            请严格按照以下JSON格式返回，recommendations数组中的每一项对应输入的每个网页：
            {
                "recommendations": [
                    {
                        "url": "网页URL",
                        "existingPath": "推荐的现有文件夹完整路径",
                        "reason": "推荐理由"
                    }
                ]
            }`;

        return await this.callAI(prompt);
    }
}

export { AIService }; 