// 在文件最开始添加
console.warn('=== Content Script 开始加载 ===', window.location.href);

// 检查当前页面是否已收藏
async function checkIfBookmarked() {
    console.warn('=== 开始检查页面书签状态 ===');
    try {
        return new Promise((resolve, reject) => {
            const currentUrl = window.location.href.split('#')[0].replace(/\/$/, '');
            console.warn('检查书签状态 - 当前页面URL:', currentUrl);

            chrome.runtime.sendMessage({ 
                type: 'CHECK_BOOKMARK',
                url: currentUrl 
            }, (response) => {
                const error = chrome.runtime.lastError;
                if (error) {
                    console.error('检查书签状态失败:', error);
                    reject(error);
                    return;
                }

                console.warn('书签检查结果:', response);
                resolve(response.bookmark);
            });
        });
    } catch (error) {
        console.error('检查书签状态失败:', error);
        throw error;
    }
}

// 显示提示框函数
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `ai-bookmark-toast ${type}`;
    
    // 添加图标
    let icon = '';
    if (type === 'success') {
        icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (type === 'error') {
        icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
    }
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    
    // 2秒后移除提示框
    setTimeout(() => toast.remove(), 2000);
}

// 等待 Chrome API 就绪
async function waitForChromeAPI() {
    console.warn('开始等待 Chrome API...');
    
    return new Promise((resolve, reject) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            reject(new Error('Chrome API 不可用'));
            return;
        }

        chrome.runtime.sendMessage({ type: 'CHECK_BOOKMARKS_API' }, (response) => {
            const error = chrome.runtime.lastError;
            if (error) {
                console.error('检查书签 API 失败:', error);
                reject(error);
                return;
            }

            if (response && response.hasAccess) {
                console.warn('Chrome API 已就绪，可以使用');
                resolve(true);
            } else {
                reject(new Error('无法访问书签 API'));
            }
        });
    });
}

// 创建悬浮球
async function createFloatingButton() {
    console.warn('=== 开始创建悬浮球 ===');
    
    try {
        // 等待 Chrome API 就绪
        await waitForChromeAPI();
        console.log('Chrome API 已就绪，开始检查书签状态');

        // 检查当前页面是否已收藏
        const bookmark = await checkIfBookmarked();
        console.warn('书签状态检查结果:', bookmark ? '已收藏' : '未收藏');
        
        const isBookmarked = !!bookmark;
        console.warn('页面是否已收藏:', isBookmarked);

        // 如果已经存在悬浮球，先移除
        const existingButton = document.getElementById('ai-bookmark-float');
        if (existingButton) {
            console.log('发现已存在的悬浮球，移除它');
            existingButton.remove();
        }

        // 创建新的悬浮球
        console.log('开始创建新的悬浮球');
        const floatButton = document.createElement('div');
        floatButton.id = 'ai-bookmark-float';
        let savedLocation = '';

        // 创建图标
        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL('assets/icon48.png');
        icon.draggable = false;
        floatButton.appendChild(icon);
        
        // 创建提示文字
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        floatButton.appendChild(tooltip);

        // 根据书签状态设置初始状态
        if (isBookmarked) {
            console.warn('设置已收藏状态');
            floatButton.classList.add('disabled');
            floatButton.style.cursor = 'not-allowed';
            icon.style.opacity = '0.5';
            floatButton.style.pointerEvents = 'none';
            floatButton.onclick = null;  // 确保移除点击事件
            
            // 使用从 background 返回的完整信息
            if (bookmark.parentFolder) {
                savedLocation = bookmark.parentFolder.title;
                tooltip.textContent = `已收藏在：${savedLocation}`;
                console.warn('设置已收藏状态完成，位置:', savedLocation);
            } else {
                tooltip.textContent = '已收藏';
                console.warn('设置已收藏状态完成，无法获取位置');
            }
        } else {
            console.log('设置未收藏状态');
            tooltip.textContent = '点我收藏当前页面';
            floatButton.style.pointerEvents = 'auto';
            floatButton.style.cursor = 'pointer';
            
            // 修改事件绑定方式
            console.log('绑定点击事件');
            floatButton.onclick = async function(e) {
                console.log('点击事件触发 - onclick');
                try {
                    await handleClick(e);
                } catch (error) {
                    console.error('点击事件处理失败:', error);
                }
            };
            
            // 添加调试用的事件监听
            floatButton.addEventListener('mousedown', () => console.log('mousedown 事件触发'));
            floatButton.addEventListener('mouseup', () => console.log('mouseup 事件触发'));
            floatButton.addEventListener('click', () => console.log('click 事件触发 - addEventListener'));
        }

        // 添加到页面
        console.log('将悬浮球添加到页面');
        document.body.appendChild(floatButton);
        
        console.log('初始化拖动功能');
        initializeDrag(floatButton);
        
        console.log('=== 悬浮球创建完成 ===');
        return { floatButton, savedLocation };
    } catch (error) {
        console.error('创建悬浮球失败:', error);
        throw error;
    }
}

// 处理点击事件
async function handleClick(e) {
    console.log('=== 开始处理点击事件 ===');
    console.log('事件对象:', {
        type: e.type,
        target: e.target,
        currentTarget: e.currentTarget,
        eventPhase: e.eventPhase
    });
    
    try {
        e.preventDefault();
        e.stopPropagation();
        
        const floatButton = e.currentTarget || e.target;
        if (!floatButton) {
            console.error('无法获取悬浮球元素');
            return;
        }
        console.log('获取到悬浮球元素:', floatButton);
        
        const icon = floatButton.querySelector('img');
        console.log('获取到图标元素:', icon);
        
        // 检查状态
        if (floatButton.classList.contains('loading') || floatButton.classList.contains('disabled')) {
            console.log('按钮当前状态:', {
                isLoading: floatButton.classList.contains('loading'),
                isDisabled: floatButton.classList.contains('disabled')
            });
            return;
        }

        console.log('开始处理收藏操作');

        // 添加加载状态
        floatButton.classList.add('loading');
        floatButton.style.pointerEvents = 'none';
        floatButton.style.cursor = 'wait';
        
        const tooltip = floatButton.querySelector('.tooltip');
        tooltip.textContent = '智能收藏中...';
        
        // 获取页面信息
        const pageInfo = {
            title: document.title,
            url: window.location.href,
            description: document.querySelector('meta[name="description"]')?.content || ''
        };
        console.log('准备发送的页面信息:', pageInfo);

        // 发送消息到后台
        console.log('开始发送收藏请求...');
        const response = await chrome.runtime.sendMessage({
            type: 'ADD_BOOKMARK',
            data: pageInfo
        });
        console.log('收到收藏响应:', response);

        if (response.success) {
            console.log('收藏成功，开始更新UI');
            floatButton.classList.remove('loading');
            floatButton.classList.add('disabled');
            floatButton.style.pointerEvents = 'none';
            floatButton.style.cursor = 'not-allowed';
            
            const folderInfo = response.data.folderInfo;
            tooltip.textContent = `已收藏在：${folderInfo.path}`;
            
            icon.style.opacity = '0.5';
            showToast('收藏成功！', 'success');
            
            // 移除所有点击事件
            floatButton.onclick = null;
            floatButton.style.pointerEvents = 'none';
            
            // 触发重新检查
            await checkIfBookmarked();
        } else {
            throw new Error(response.error || '收藏失败');
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        const floatButton = e.currentTarget || e.target;
        if (floatButton) {
            floatButton.classList.remove('loading');
            floatButton.style.pointerEvents = 'auto';
            floatButton.style.cursor = 'pointer';
            const tooltip = floatButton.querySelector('.tooltip');
            if (tooltip) {
                tooltip.textContent = '点我收藏当前页面';
            }
        }
        showToast('收藏失败：' + error.message, 'error');
    }
    console.log('=== 点击事件处理完成 ===');
}

// 初始化拖动功能
function initializeDrag(floatButton) {
    let isDragging = false;
    let startY;

    floatButton.onmousedown = (e) => {
        if (e.button !== 0) return; // 只响应左键
        isDragging = true;
        startY = e.clientY - floatButton.offsetTop;
        e.preventDefault();
        floatButton.style.transition = 'none';  // 拖动时禁用过渡效果
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        
        const newY = e.clientY - startY;
        const maxY = window.innerHeight - floatButton.offsetHeight;
        floatButton.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        floatButton.style.transform = 'translateY(0)';
    };

    document.onmouseup = () => {
        if (isDragging) {
            isDragging = false;
            floatButton.style.transition = 'all 0.3s ease';  // 恢复过渡效果
        }
    };
}

// 创建并添加样式
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes loading {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        #ai-bookmark-float {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
            z-index: 2147483647;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            pointer-events: auto !important;
        }
        #ai-bookmark-float.loading {
            cursor: wait !important;
            pointer-events: none;
            opacity: 0.7;
        }
        #ai-bookmark-float:not(.disabled):not(.loading) {
            cursor: pointer;
        }
        #ai-bookmark-float.loading img {
            animation: loading 1s linear infinite;
        }
        #ai-bookmark-float img {
            width: 32px;
            height: 32px;
            transition: all 0.3s ease;
            pointer-events: none !important;
        }
        #ai-bookmark-float.disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }
        #ai-bookmark-float:not(.disabled):hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        #ai-bookmark-float .tooltip {
            position: absolute;
            right: 60px;
            background-color: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: none !important;
        }
        #ai-bookmark-float:hover .tooltip {
            opacity: 1;
            visibility: visible;
        }
        #ai-bookmark-float.loading .tooltip {
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    
    document.head.appendChild(style);
}

// 添加初始化函数
async function initializeButton() {
    console.log('=== 开始初始化按钮 ===');
    try {
        console.log('开始创建新的悬浮球');
        await createFloatingButton();
        console.log('悬浮球创建完成');
    } catch (error) {
        console.error('初始化按钮失败:', error);
        if (error.message.includes('API')) {
            console.log('API错误，将在1秒后重试');
            setTimeout(initializeButton, 1000);
        }
    }
    console.log('=== 初始化按钮完成 ===');
}

// 修改初始化函数
async function init() {
    console.warn('=== 开始初始化扩展 ===', {
        readyState: document.readyState,
        url: window.location.href
    });
    
    try {
        // 确保在扩展环境中运行
        console.warn('等待 Chrome API 初始化...');
        await waitForChromeAPI();
        console.warn('Chrome API 初始化成功');

        // 等待 DOM 加载完成
        if (document.readyState !== 'complete') {
            console.warn('等待页面加载完成...');
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        
        console.warn('页面加载完成，添加样式');
        addStyles();

        // 初始化悬浮球
        console.warn('开始初始化悬浮球');
        await initializeButton();
        console.warn('悬浮球初始化完成');

        // 设置事件监听
        console.warn('设置事件监听器');
        
        // 监听书签变化
        const handleBookmarkChange = async () => {
            console.warn('检测到书签变化，重新检查状态');
            const bookmark = await checkIfBookmarked();
            console.warn('重新检查结果:', bookmark ? '已收藏' : '未收藏');
            await initializeButton();
        };

        // 使用 runtime.sendMessage 来监听书签变化
        chrome.runtime.onMessage.addListener((request) => {
            if (request.type === 'BOOKMARK_CHANGED') {
                handleBookmarkChange();
            }
        });

        // 立即进行一次检查
        console.warn('执行初始书签状态检查');
        const initialBookmark = await checkIfBookmarked();
        console.warn('初始书签状态:', initialBookmark ? '已收藏' : '未收藏');

    } catch (error) {
        console.error('初始化失败:', error);
    }
    console.warn('=== 初始化扩展完成 ===');
}

// 立即执行初始化
init(); 