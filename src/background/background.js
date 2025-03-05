import { BookmarkManager } from '../utils/bookmarks.js';
import { AIService } from '../utils/ai.js';

// 添加一个日志工具方法
function log(message, data = null) {
    const logMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    console.log(logMessage);
    
    // 发送日志到前端
    chrome.runtime.sendMessage({
        type: 'ORGANIZE_LOG',
        data: logMessage
    }).catch(() => {}); // 忽略发送失败的情况
}

class BackgroundService {
    constructor() {
        this.bookmarkManager = new BookmarkManager();
        this.aiService = null;
        this.isOrganizing = false;
        this.shouldStop = false;
        this.setupMessageListeners();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('收到消息:', request.type);
            
            if (request.type === 'CHECK_BOOKMARKS_API') {
                // 检查书签 API 权限
                if (chrome.bookmarks) {
                    // 直接尝试使用 bookmarks API
                    chrome.bookmarks.getTree((tree) => {
                        console.log('书签 API 可用，书签树:', tree);
                        sendResponse({ hasAccess: true });
                    });
                    return true; // 保持消息通道开放
                } else {
                    console.error('书签 API 不可用');
                    sendResponse({ hasAccess: false });
                }
            }

            if (request.type === 'CHECK_BOOKMARK') {
                // 检查特定 URL 是否已收藏
                chrome.bookmarks.search({ url: request.url }, (results) => {
                    if (results.length > 0) {
                        // 找到书签后，获取其父文件夹信息
                        chrome.bookmarks.get(results[0].parentId, (parents) => {
                            console.log('书签搜索结果:', results[0], '父文件夹:', parents[0]);
                            sendResponse({
                                isBookmarked: true,
                                bookmark: {
                                    ...results[0],
                                    parentFolder: parents[0]
                                }
                            });
                        });
                    } else {
                        sendResponse({
                            isBookmarked: false,
                            bookmark: null
                        });
                    }
                });
                return true;
            }
            
            if (request.type === 'ADD_BOOKMARK') {
                // 处理添加书签的请求
                this.addNewBookmark(request.data)
                    .then(response => {
                        console.log('添加书签成功:', response);
                        sendResponse({ success: true, data: response });
                    })
                    .catch(error => {
                        console.error('添加书签失败:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            }

            if (request.type === 'UPDATE_AI_CONFIG') {
                // 立即更新 AI 服务配置
                this.initAIService()
                    .then(() => {
                        console.log('AI服务配置已更新');
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('更新AI服务配置失败:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            }

            if (request.type === 'ORGANIZE_BOOKMARKS') {
                // 在处理整理请求前，确保重新初始化 AI 服务
                this.initAIService()
                    .then(() => this.organizeAllBookmarks())
                    .then(result => {
                        sendResponse({ success: true, data: result });
                    })
                    .catch(error => {
                        console.error('整理书签失败:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            }

            if (request.type === 'STOP_ORGANIZE') {
                console.log('收到停止整理请求');
                this.isOrganizing = false;
                this.shouldStop = true;
                sendResponse({ success: true });
                return true;
            }
        });
    }

    async init() {
        // 监听标签更新
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                chrome.tabs.sendMessage(tabId, { type: 'PAGE_LOADED' });
            }
        });

        // 监听标签页更新
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: initContentScript
                });
            }
        });

        // 初始化AI服务
        await this.initAIService();

        // 监听书签变化并广播到所有标签页
        const broadcastBookmarkChange = () => {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { type: 'BOOKMARK_CHANGED' })
                        .catch(() => {}); // 忽略不能接收消息的标签页
                });
            });
        };

        chrome.bookmarks.onCreated.addListener(broadcastBookmarkChange);
        chrome.bookmarks.onRemoved.addListener(broadcastBookmarkChange);
        chrome.bookmarks.onChanged.addListener(broadcastBookmarkChange);
    }

    // 初始化AI服务
    async initAIService() {
        console.log('开始初始化 AI 服务...');
        const config = await chrome.storage.local.get(['apiKey', 'provider', 'baseUrl', 'model']);
        console.log('获取到的配置:', { ...config, apiKey: config.apiKey ? '已设置' : '未设置' });

        if (!config.apiKey) {
            console.error('未找到 API 密钥配置');
            throw new Error('请先配置AI服务的API密钥');
        }

        try {
            this.aiService = new AIService(
                config.apiKey,
                config.provider || 'openai',
                config.baseUrl || ''
            );
            if (config.model) {
                this.aiService.setModel(config.model);
            }
            console.log('AI 服务初始化成功');
        } catch (error) {
            console.error('AI 服务初始化失败:', error);
            throw error;
        }
    }

    // 一键整理所有书签
    async organizeAllBookmarks() {
        if (!this.aiService) {
            throw new Error('请先配置AI服务');
        }

        try {
            console.log('开始整理所有书签...');
            this.isOrganizing = true;
            this.shouldStop = false;
            
            // 获取所有书签（包括标题和URL）
            const allBookmarks = await this.bookmarkManager.getAllBookmarks();
            // 过滤出有效的书签（必须有URL和标题）
            const bookmarksToOrganize = allBookmarks.filter(bookmark => 
                bookmark.url && 
                bookmark.title && 
                bookmark.url.startsWith('http') && 
                !bookmark.url.includes('chrome://') && 
                !bookmark.url.includes('chrome-extension://')
            );
            
            console.log('需要整理的有效书签数量:', bookmarksToOrganize.length);
            
            // 获取所有现有文件夹
            const existingFolders = await this.bookmarkManager.getAllFolders();
            
            // 按批次处理书签（每批5个）
            const batchSize = 5;
            const totalBatches = Math.ceil(bookmarksToOrganize.length / batchSize);
            
            let processedCount = 0;
            let successCount = 0;
            let failureCount = 0;
            let logs = [];

            // 批量处理书签
            for (let i = 0; i < bookmarksToOrganize.length; i += batchSize) {
                // 检查是否需要立即停止
                if (this.shouldStop) {
                    console.log('整理过程被手动停止');
                    return {
                        success: true,
                        message: `整理已停止！成功: ${successCount}, 失败: ${failureCount}`,
                        details: {
                            total: bookmarksToOrganize.length,
                            success: successCount,
                            failure: failureCount
                        }
                    };
                }

                const batch = bookmarksToOrganize.slice(i, i + batchSize);
                console.log(`开始处理第 ${Math.floor(i / batchSize) + 1} 批，包含 ${batch.length} 个书签`);
                
                const currentBatch = batch.map(b => ({
                    title: b.title || '',
                    url: b.url || '',
                    id: b.id,
                    parentId: b.parentId,
                    parentTitle: existingFolders.find(f => f.id === b.parentId)?.title || ''
                }));

                try {
                    // 在每个AI调用前检查停止标志
                    if (this.shouldStop) {
                        break;
                    }
                    
                    // 更新进度
                    const progress = {
                        current: Math.floor((i / bookmarksToOrganize.length) * 100),
                        total: 100,
                        currentBatch: Math.floor(i / batchSize) + 1,
                        totalBatches: totalBatches,
                        processed: processedCount,
                        success: successCount,
                        failure: failureCount
                    };

                    // 发送进度更新
                    chrome.runtime.sendMessage({
                        type: 'ORGANIZE_PROGRESS',
                        data: progress
                    }).catch(() => {});

                    // 获取AI推荐
                    console.log('发送给AI的数据:', {
                        batch: currentBatch,
                        existingFolders: existingFolders
                    });
                    
                    const recommendationsJson = await this.aiService.analyzeBatchPages(currentBatch, existingFolders);
                    console.log('AI返回的原始JSON字符串:', recommendationsJson);
                    
                    const recommendations = JSON.parse(recommendationsJson);
                    console.log('解析后的AI推荐:', recommendations);

                    // 处理每个推荐
                    for (let j = 0; j < recommendations.recommendations.length; j++) {
                        const rec = recommendations.recommendations[j];
                        const bookmark = batch[j];
                        
                        try {
                            // 查找目标文件夹
                            const targetFolder = existingFolders.find(f => f.path === rec.existingPath);
                            if (!targetFolder) {
                                throw new Error(`未找到目标文件夹: ${rec.existingPath}`);
                            }

                            // 移动书签
                            console.log('准备移动书签:', {
                                bookmarkTitle: bookmark.title,
                                fromPath: bookmark.parentTitle,
                                toPath: rec.existingPath,
                                reason: rec.reason
                            });

                            await this.bookmarkManager.moveBookmark(bookmark.id, targetFolder.id);
                            successCount++;
                            logs.push(`✅ 成功移动 "${bookmark.title}" 到 "${rec.existingPath}"\n   原因: ${rec.reason}`);
                        } catch (error) {
                            failureCount++;
                            logs.push(`❌ 移动失败 "${bookmark.title}": ${error.message}`);
                        }
                        processedCount++;
                    }

                    // 在处理完每个批次后也检查停止标志
                    if (this.shouldStop) {
                        break;
                    }
                } catch (error) {
                    console.error('批次处理失败:', error);
                    logs.push(`❌ 批次处理失败: ${error.message}`);
                    failureCount += batch.length;
                    processedCount += batch.length;
                    
                    // 错误处理后也检查停止标志
                    if (this.shouldStop) {
                        break;
                    }
                }
            }

            this.isOrganizing = false;
            this.shouldStop = false;
            const result = {
                message: `整理完成！成功: ${successCount}, 失败: ${failureCount}`,
                details: {
                    total: bookmarksToOrganize.length,
                    success: successCount,
                    failure: failureCount
                }
            };
            
            console.log('整理完成，最终结果:', result);
            return result;

        } catch (error) {
            this.isOrganizing = false;
            this.shouldStop = false;
            console.error('整理书签失败:', error);
            throw error;
        }
    }

    // 智能添加新书签
    async addNewBookmark(pageInfo) {
        console.log('添加书签:', pageInfo);
        if (!this.aiService) {
            throw new Error('请先配置AI服务');
        }

        try {
            // 获取所有现有文件夹
            const existingFolders = await this.bookmarkManager.getAllFolders();
            console.log('现有文件夹:', existingFolders);

            const recommendation = await this.aiService.analyzePage(pageInfo, existingFolders);
            console.log('AI分析结果:', recommendation);

            let result;
            try {
                result = JSON.parse(recommendation);
            } catch (e) {
                console.error('AI返回格式错误:', e);
                throw new Error('AI返回格式错误，请重试');
            }

            let targetFolderId;
            let folderInfo = {
                isNewFolder: !result.useExisting,
                path: result.useExisting ? result.existingPath : result.newPath,
                reason: result.reason
            };

            if (result.useExisting) {
                // 使用现有文件夹
                const folder = existingFolders.find(f => f.path === result.existingPath);
                if (!folder) {
                    throw new Error('未找到推荐的现有文件夹');
                }
                targetFolderId = folder.id;
            } else {
                // 创建新的文件夹结构
                const folders = result.newPath.split('/').filter(f => f);
                let currentParentId = '1';
                
                for (const folderName of folders) {
                    const searchResults = await this.bookmarkManager.searchBookmarks({
                        title: folderName,
                        parentId: currentParentId
                    });
                    
                    if (searchResults.length > 0) {
                        currentParentId = searchResults[0].id;
                    } else {
                        const newFolder = await this.bookmarkManager.createFolder(folderName, currentParentId);
                        currentParentId = newFolder.id;
                    }
                }
                targetFolderId = currentParentId;
            }

            // 创建书签
            const bookmark = await this.bookmarkManager.createBookmark(
                pageInfo.title,
                pageInfo.url,
                targetFolderId
            );
            console.log('创建书签成功:', bookmark);
            return {
                success: true,
                bookmark: bookmark,
                folderInfo: folderInfo
            };
        } catch (error) {
            console.error('创建书签失败:', error);
            throw error;
        }
    }
}

// 初始化后台服务
const backgroundService = new BackgroundService();
backgroundService.init();

// 初始化内容脚本的函数
function initContentScript() {
    // 检查是否已经注入
    if (document.querySelector('#ai-bookmark-float')) {
        return;
    }

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        #ai-bookmark-float {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        #ai-bookmark-float:hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        #ai-bookmark-float.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #ai-bookmark-float img {
            width: 32px;
            height: 32px;
        }
    `;
    document.head.appendChild(style);

    // 创建悬浮球
    const floatButton = document.createElement('div');
    floatButton.id = 'ai-bookmark-float';
    
    // 创建图标
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/icon48.png');
    floatButton.appendChild(icon);

    // 添加点击事件
    floatButton.addEventListener('click', async () => {
        if (floatButton.classList.contains('disabled')) {
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ADD_BOOKMARK',
                data: {
                    title: document.title,
                    url: window.location.href,
                    description: document.querySelector('meta[name="description"]')?.content || ''
                }
            });

            if (response.success) {
                floatButton.classList.add('disabled');
            }
        } catch (error) {
            console.error('添加书签失败:', error);
        }
    });

    // 检查当前页面是否已收藏
    chrome.runtime.sendMessage(
        { type: 'CHECK_BOOKMARK', url: window.location.href },
        (response) => {
            if (response && response.isBookmarked) {
                floatButton.classList.add('disabled');
            }
        }
    );

    // 添加到页面
    document.body.appendChild(floatButton);
}

// 处理添加书签的函数
async function handleAddBookmark(pageInfo) {
    // ... 保持原有的书签添加逻辑不变 ...
} 