document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const providerSelect = document.getElementById('provider');
    const modelSelect = document.getElementById('model');
    const apiKeyInput = document.getElementById('apiKey');
    const baseUrlInput = document.getElementById('baseUrl');
    const organizeBtn = document.getElementById('organizeBtn');
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const statusDiv = document.getElementById('status');

    // 根据provider显示/隐藏模型选择
    function updateModelSelectVisibility() {
        const modelGroup = document.getElementById('modelSelectGroup');
        modelGroup.style.display = providerSelect.value === 'openai' ? 'block' : 'none';
    }

    // 显示状态信息
    function showStatus(message, type = 'success') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }

    // 检查当前页面是否已收藏
    async function checkIfCurrentPageBookmarked() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const bookmarks = await chrome.bookmarks.search({ url: tab.url });
            
            if (bookmarks.length > 0) {
                bookmarkBtn.disabled = true;
                bookmarkBtn.textContent = '已收藏';
                bookmarkBtn.style.backgroundColor = '#cccccc';
                
                // 显示当前收藏位置
                const bookmark = bookmarks[0];
                const nodes = await chrome.bookmarks.get(bookmark.parentId);
                const parent = nodes[0];
                showStatus(`当前页面已收藏在: ${parent.title}`, 'success');
            }
        } catch (error) {
            console.error('检查书签状态失败:', error);
        }
    }

    // 加载保存的设置
    chrome.storage.local.get(['apiKey', 'provider', 'baseUrl', 'model'], function(result) {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.provider) {
            providerSelect.value = result.provider;
        }
        if (result.baseUrl) {
            baseUrlInput.value = result.baseUrl;
        }
        if (result.model) {
            document.getElementById('model').value = result.model;
        } else {
            document.getElementById('model').value = 'gpt-4o'; // 设置默认值
        }
        updateModelSelectVisibility();
        
        // 检查当前页面的书签状态
        checkIfCurrentPageBookmarked();
    });

    // 保存设置
    function saveSettings() {
        const settings = {
            apiKey: apiKeyInput.value,
            provider: providerSelect.value,
            baseUrl: baseUrlInput.value,
            model: modelSelect.value
        };
        
        chrome.storage.local.set(settings, () => {
            // 通知后台服务更新配置
            chrome.runtime.sendMessage({ 
                type: 'UPDATE_AI_CONFIG'
            }, response => {
                if (response && response.success) {
                    showStatus('AI服务配置已更新', 'success');
                } else {
                    showStatus('AI服务配置更新失败：' + (response?.error || '未知错误'), 'error');
                }
            });
        });
        
        updateModelSelectVisibility();
    }

    // 监听设置变化
    apiKeyInput.addEventListener('change', saveSettings);
    providerSelect.addEventListener('change', saveSettings);
    baseUrlInput.addEventListener('change', saveSettings);
    modelSelect.addEventListener('change', saveSettings);

    // 创建进度显示元素
    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-container';
    progressDiv.style.display = 'none';
    progressDiv.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <div class="progress-text"></div>
        <div class="progress-logs"></div>
    `;
    statusDiv.parentNode.insertBefore(progressDiv, statusDiv);

    // 监听整理进度更新
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ORGANIZE_PROGRESS') {
            const progress = message.data;
            progressDiv.style.display = 'block';
            
            // 更新进度条
            const progressFill = progressDiv.querySelector('.progress-fill');
            progressFill.style.width = `${progress.current}%`;
            
            // 更新进度文本
            const progressText = progressDiv.querySelector('.progress-text');
            progressText.textContent = `处理中... ${progress.current}% (${progress.currentBatch}/${progress.totalBatches}批)
                处理: ${progress.processed}, 成功: ${progress.success}, 失败: ${progress.failure}`;
            
            // 更新日志
            const logsDiv = progressDiv.querySelector('.progress-logs');
            logsDiv.innerHTML = progress.logs.slice(-5).map(log => `<div>${log}</div>`).join('');
        }
    });

    // 修改停止按钮创建和事件监听
    const stopBtn = document.createElement('button');
    stopBtn.id = 'stopBtn';
    stopBtn.className = 'stop-button';  // 使用正确的类名
    stopBtn.innerHTML = '<span>停止整理</span>';  // 添加内部span以优化样式
    stopBtn.style.display = 'none';
    organizeBtn.parentNode.insertBefore(stopBtn, organizeBtn.nextSibling);

    // 修改一键整理功能
    organizeBtn.addEventListener('click', async function() {
        organizeBtn.disabled = true;
        organizeBtn.textContent = '整理中...';
        const stopBtn = document.getElementById('stopBtn');
        stopBtn.style.display = 'inline-block';
        stopBtn.disabled = false; // 重置停止按钮状态
        stopBtn.classList.remove('disabled'); // 移除禁用样式
        const progressDiv = document.querySelector('.progress-container');
        progressDiv.style.display = 'block';
        showStatus('正在初始化AI服务...', 'info');

        try {
            await saveSettings();
            
            const response = await chrome.runtime.sendMessage({
                type: 'ORGANIZE_BOOKMARKS'
            });

            if (response.success) {
                showStatus(`${response.data.message}`, 'success');
                progressDiv.style.display = 'none';
            } else {
                showStatus('整理失败：' + response.error, 'error');
            }
        } catch (error) {
            showStatus('发生错误：' + error.message, 'error');
        } finally {
            organizeBtn.disabled = false;
            organizeBtn.textContent = '一键整理书签';
            stopBtn.style.display = 'none';
            stopBtn.disabled = false; // 确保停止按钮状态被重置
            stopBtn.classList.remove('disabled'); // 确保移除禁用样式
        }
    });

    // 修改停止按钮事件监听
    stopBtn.addEventListener('click', async function() {
        if (stopBtn.disabled) return; // 如果按钮已禁用，直接返回
        
        try {
            stopBtn.disabled = true;
            stopBtn.classList.add('disabled');
            
            const response = await chrome.runtime.sendMessage({ 
                type: 'STOP_ORGANIZE',
                data: { stop: true }
            });
            
            if (response && response.success) {
                showStatus('正在停止整理...', 'info');
                const progressDiv = document.querySelector('.progress-container');
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
                organizeBtn.disabled = false;
                organizeBtn.textContent = '一键整理书签';
                stopBtn.style.display = 'none';
                stopBtn.disabled = false; // 重置停止按钮状态
                stopBtn.classList.remove('disabled'); // 移除禁用样式
            }
        } catch (error) {
            console.error('停止失败:', error);
            showStatus('停止失败：' + error.message, 'error');
            stopBtn.disabled = false;
            stopBtn.classList.remove('disabled');
        }
    });

    // 修改收藏当前页面功能
    bookmarkBtn.addEventListener('click', async function() {
        bookmarkBtn.disabled = true;
        bookmarkBtn.textContent = '收藏中...';
        statusDiv.className = 'status';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const pageInfo = {
                title: tab.title,
                url: tab.url,
                description: ''
            };

            const response = await chrome.runtime.sendMessage({
                type: 'ADD_BOOKMARK',
                data: pageInfo
            });

            if (response.success) {
                const folderInfo = response.data.folderInfo;
                const message = folderInfo.isNewFolder
                    ? `已收藏到新建文件夹: ${folderInfo.path}\n原因: ${folderInfo.reason}`
                    : `已收藏到现有文件夹: ${folderInfo.path}\n原因: ${folderInfo.reason}`;
                showStatus(message, 'success');
                
                // 更新按钮状态为已收藏
                bookmarkBtn.disabled = true;
                bookmarkBtn.textContent = '已收藏';
                bookmarkBtn.style.backgroundColor = '#cccccc';
                bookmarkBtn.style.cursor = 'not-allowed';
            } else {
                showStatus('收藏失败：' + response.error, 'error');
                bookmarkBtn.disabled = false;
                bookmarkBtn.textContent = '收藏当前页面';
            }
        } catch (error) {
            showStatus('发生错误：' + error.message, 'error');
            bookmarkBtn.disabled = false;
            bookmarkBtn.textContent = '收藏当前页面';
        }
    });

    // 创建日志容器
    const debugLogsDiv = document.createElement('div');
    debugLogsDiv.className = 'debug-logs';
    debugLogsDiv.style.display = 'none';
    statusDiv.parentNode.insertBefore(debugLogsDiv, statusDiv);

    // 监听日志消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ORGANIZE_LOG') {
            debugLogsDiv.style.display = 'block';
            const logEntry = document.createElement('div');
            logEntry.textContent = message.data;
            debugLogsDiv.appendChild(logEntry);
            debugLogsDiv.scrollTop = debugLogsDiv.scrollHeight;
        }
    });
}); 