/// <reference path="../types/chrome.d.ts" />

interface Bookmark extends chrome.bookmarks.BookmarkTreeNode {}

// 加载书签列表
function loadBookmarks(folderId: string) {
    chrome.bookmarks.getChildren(folderId, (bookmarks: Bookmark[]) => {
        const container = document.getElementById('bookmarksContainer');
        if (!container) return;

        container.innerHTML = '';

        // 创建书签容器
        const bookmarksWrapper = document.createElement('div');
        bookmarksWrapper.className = 'bookmarks-wrapper';

        bookmarks.forEach(bookmark => {
            if (!bookmark.url) return; // 跳过文件夹
            const bookmarkEl = createBookmarkElement(bookmark);
            bookmarksWrapper.appendChild(bookmarkEl);
        });

        container.appendChild(bookmarksWrapper);
    });
}

// 加载所有书签
function loadAllBookmarks() {
    chrome.bookmarks.getTree((bookmarkTreeNodes: Bookmark[]) => {
        const container = document.getElementById('bookmarksContainer');
        if (!container) return;

        container.innerHTML = '';

        // 创建一个 Map 来存储文件夹及其书签
        const folderMap = new Map<string, { title: string, bookmarks: Bookmark[] }>();

        function traverseForBookmarks(nodes: Bookmark[], parentTitle = '') {
            nodes.forEach(node => {
                if (node.url) {
                    // 如果是书签，添加到对应文件夹的数组中
                    if (!folderMap.has(parentTitle)) {
                        folderMap.set(parentTitle, { title: parentTitle, bookmarks: [] });
                    }
                    folderMap.get(parentTitle)?.bookmarks.push(node);
                } else if (node.children) {
                    // 如果是文件夹，递归处理其子节点
                    if (node.title !== "书签栏") { // 跳过根节点的标题
                        traverseForBookmarks(node.children, node.title);
                    } else {
                        traverseForBookmarks(node.children);
                    }
                }
            });
        }

        traverseForBookmarks(bookmarkTreeNodes);

        // 按文件夹分组创建书签元素
        folderMap.forEach((folder, folderTitle) => {
            if (folder.bookmarks.length > 0) {
                // 创建文件夹标题
                if (folderTitle) {
                    const folderHeader = document.createElement('div');
                    folderHeader.className = 'folder-header';
                    folderHeader.innerHTML = `<h3><span class="folder-icon">📁</span> ${folderTitle}</h3>`;
                    container.appendChild(folderHeader);
                }

                // 创建书签容器
                const bookmarksWrapper = document.createElement('div');
                bookmarksWrapper.className = 'bookmarks-wrapper';

                // 添加书签
                folder.bookmarks.forEach(bookmark => {
                    const bookmarkEl = createBookmarkElement(bookmark);
                    bookmarksWrapper.appendChild(bookmarkEl);
                });

                container.appendChild(bookmarksWrapper);
            }
        });
    });
}

// 创建书签元素
function createBookmarkElement(bookmark: Bookmark): HTMLElement {
    const bookmarkEl = document.createElement('div');
    bookmarkEl.className = 'bookmark-card';
    bookmarkEl.draggable = true;
    bookmarkEl.dataset.bookmarkId = bookmark.id;

    const favicon = document.createElement('img');
    favicon.className = 'favicon';
    favicon.src = 'icons/default-favicon.png';

    if (bookmark.url) {
        const url = new URL(bookmark.url);
        const hostname = url.hostname;

        // 尝试多个来源获取高清图标
        const iconUrls = [
            // 1. Favicon Kit API (SVG优先)
            `https://api.faviconkit.com/${hostname}/144`,
            // 2. Google 的高清图标 API (128px)
            `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`,
            // 3. Icon Horse API (支持SVG)
            `https://icon.horse/icon/${hostname}`,
            // 4. Favicon Grabber
            `https://favicongrabber.com/api/grab/${hostname}`,
            // 5. 网站自身的 SVG 图标
            `${url.protocol}//${hostname}/favicon.svg`,
            // 6. 网站自身的高清图标
            `${url.protocol}//${hostname}/apple-touch-icon.png`,
            `${url.protocol}//${hostname}/apple-touch-icon-precomposed.png`,
            // 7. DuckDuckGo 的图标 API
            `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
            // 8. 网站自身的标准图标
            `${url.protocol}//${hostname}/favicon.png`,
            `${url.protocol}//${hostname}/favicon.ico`,
            // 9. 备用图标
            'icons/default-favicon.png'
        ];

        let currentIconIndex = 0;

        const tryNextIcon = () => {
            if (currentIconIndex < iconUrls.length) {
                // 对于某些需要特殊处理的 API
                if (iconUrls[currentIconIndex].includes('favicongrabber.com')) {
                    fetch(iconUrls[currentIconIndex])
                        .then(response => response.json())
                        .then(data => {
                            if (data.icons && data.icons.length > 0) {
                                // 优先选择 SVG 格式
                                const svgIcon = data.icons.find((icon: any) =>
                                    icon.src.endsWith('.svg') || icon.type === 'image/svg+xml'
                                );
                                // 其次选择尺寸最大的图标
                                const largestIcon = data.icons.reduce((prev: any, current: any) => {
                                    const prevSize = prev.sizes ? parseInt(prev.sizes.split('x')[0]) : 0;
                                    const currentSize = current.sizes ? parseInt(current.sizes.split('x')[0]) : 0;
                                    return currentSize > prevSize ? current : prev;
                                });
                                favicon.src = svgIcon ? svgIcon.src : largestIcon.src;
                            } else {
                                currentIconIndex++;
                                tryNextIcon();
                            }
                        })
                        .catch(() => {
                            currentIconIndex++;
                            tryNextIcon();
                        });
                } else {
                    favicon.src = iconUrls[currentIconIndex];
                    currentIconIndex++;
                }
            }
        };

        favicon.onerror = tryNextIcon;
        tryNextIcon(); // 开始尝试第一个图标
    }

    favicon.alt = '';
    favicon.loading = 'lazy'; // 添加延迟加载
    favicon.decoding = 'async'; // 异步解码图片

    const contentDiv = document.createElement('div');
    contentDiv.className = 'bookmark-content';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title;

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = bookmark.url || '';

    // 添加文件夹信息
    const folderInfo = document.createElement('div');
    folderInfo.className = 'bookmark-folder';

    // 获取父文件夹信息
    if (bookmark.parentId) {
        chrome.bookmarks.get(bookmark.parentId, (parents) => {
            if (parents && parents.length > 0) {
                const parent = parents[0];
                folderInfo.innerHTML = `<span class="folder-icon">📁</span> ${parent.title}`;
            }
        });
    }

    const dateAdded = document.createElement('div');
    dateAdded.className = 'bookmark-date';
    const date = new Date(bookmark.dateAdded || 0);
    dateAdded.textContent = `添加于 ${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`;

    contentDiv.appendChild(title);
    contentDiv.appendChild(url);
    contentDiv.appendChild(folderInfo);
    contentDiv.appendChild(dateAdded);

    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = '编辑';
    editBtn.onclick = (e: Event) => {
        e.stopPropagation();
        // 编辑书签的代码...
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.onclick = (e: Event) => {
        e.stopPropagation();
        if (confirm('确定要删除这个书签吗？')) {
            chrome.bookmarks.remove(bookmark.id, () => {
                const parentFolder = document.querySelector('.folder-item.active') as HTMLDivElement;
                if (parentFolder?.dataset.folderId) {
                    loadBookmarks(parentFolder.dataset.folderId);
                } else {
                    loadAllBookmarks();
                }
            });
        }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    bookmarkEl.appendChild(favicon);
    bookmarkEl.appendChild(contentDiv);
    bookmarkEl.appendChild(actions);

    // 添加拖拽事件监听器
    bookmarkEl.addEventListener('dragstart', handleDragStart);
    bookmarkEl.addEventListener('dragend', handleDragEnd);

    bookmarkEl.onclick = () => {
        if (bookmark.url) {
            chrome.tabs.create({ url: bookmark.url });
        }
    };

    return bookmarkEl;
}

// 创建文件夹元素
function createFolderElement(folder: Bookmark): HTMLElement {
    const folderEl = document.createElement('div');
    folderEl.className = 'folder-item';
    folderEl.dataset.folderId = folder.id;
    folderEl.draggable = true;

    const icon = document.createElement('span');
    icon.className = 'folder-icon';
    icon.textContent = '📁';

    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folder.title;

    const actions = document.createElement('div');
    actions.className = 'folder-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = '编辑';
    editBtn.onclick = (e: Event) => {
        e.stopPropagation();
        // 编辑文件夹的代码...
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.onclick = (e: Event) => {
        e.stopPropagation();
        if (confirm('确定要删除这个文件夹吗？文件夹中的所有书签也会被删除。')) {
            chrome.bookmarks.remove(folder.id, () => {
                loadFolders();
                loadAllBookmarks();
            });
        }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    folderEl.appendChild(icon);
    folderEl.appendChild(name);
    folderEl.appendChild(actions);

    // 添加文件夹拖拽事件监听器
    folderEl.addEventListener('dragstart', handleFolderDragStart);
    folderEl.addEventListener('dragend', handleFolderDragEnd);
    folderEl.addEventListener('dragenter', handleFolderDragEnter);
    folderEl.addEventListener('dragover', handleFolderDragOver);
    folderEl.addEventListener('dragleave', handleFolderDragLeave);
    folderEl.addEventListener('drop', handleFolderDrop);

    folderEl.onclick = () => {
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        folderEl.classList.add('active');
        const titleEl = document.getElementById('currentFolderTitle');
        if (titleEl) {
            titleEl.textContent = folder.title;
        }
        loadBookmarks(folder.id);
    };

    return folderEl;
}

// 拖拽相关的事件处理函数
function handleDragStart(e: DragEvent) {
    if (!e.target) return;
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', target.dataset.bookmarkId || '');
    }
    const folderList = document.querySelector('.folder-list');
    if (folderList) {
        folderList.classList.add('drag-active');
    }
}

function handleDragEnd(e: DragEvent) {
    if (!e.target) return;
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
    const folderList = document.querySelector('.folder-list');
    if (folderList) {
        folderList.classList.remove('drag-active');
    }
    // 移除所有文件夹的drag-over状态
    document.querySelectorAll('.folder-item').forEach(folder => {
        folder.classList.remove('drag-over');
    });
}

function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    if (!e.target) return;
    const folderItem = (e.target as HTMLElement).closest('.folder-item');
    if (folderItem) {
        folderItem.classList.add('drag-over');
    }
}

function handleDragOver(e: DragEvent) {
    e.preventDefault();
}

function handleDragLeave(e: DragEvent) {
    if (!e.target) return;
    const folderItem = (e.target as HTMLElement).closest('.folder-item');
    if (folderItem && e.relatedTarget && !folderItem.contains(e.relatedTarget as Node)) {
        folderItem.classList.remove('drag-over');
    }
}

function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer || !e.target) return;

    const bookmarkId = e.dataTransfer.getData('text/plain');
    const folderElement = (e.target as HTMLElement).closest('.folder-item') as HTMLDivElement;
    if (!folderElement) return;

    const targetFolderId = folderElement.dataset.folderId;
    const folderList = document.querySelector('.folder-list');

    if (bookmarkId && targetFolderId) {
        // 移动书签到新文件夹
        chrome.bookmarks.move(bookmarkId, {
            parentId: targetFolderId
        }, () => {
            // 重新加载书签��表
            const activeFolder = document.querySelector('.folder-item.active') as HTMLDivElement;
            if (activeFolder?.dataset.folderId) {
                loadBookmarks(activeFolder.dataset.folderId);
            } else {
                loadAllBookmarks();
            }
            // 移除拖拽相关的样式
            folderElement.classList.remove('drag-over');
            if (folderList) {
                folderList.classList.remove('drag-active');
            }
        });
    }
}

// 文件夹拖拽相关的事件处理函数
function handleFolderDragStart(e: DragEvent) {
    if (!e.target) return;
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.setData('folder-id', target.dataset.folderId || '');
        e.dataTransfer.setData('drag-type', 'folder');
    }
}

function handleFolderDragEnd(e: DragEvent) {
    if (!e.target) return;
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
    document.querySelectorAll('.folder-item').forEach(folder => {
        folder.classList.remove('drag-over');
    });
}

function handleFolderDragEnter(e: DragEvent) {
    e.preventDefault();
    if (!e.target) return;
    const folderItem = (e.target as HTMLElement).closest('.folder-item');
    if (folderItem && e.dataTransfer) {
        const draggedId = e.dataTransfer.getData('folder-id');
        const targetId = (folderItem as HTMLElement).dataset.folderId;

        // 防止拖到自己身上或自己的子文件夹中
        if (draggedId && targetId && draggedId !== targetId) {
            folderItem.classList.add('drag-over');
        }
    }
}

function handleFolderDragOver(e: DragEvent) {
    e.preventDefault();
}

function handleFolderDragLeave(e: DragEvent) {
    if (!e.target) return;
    const folderItem = (e.target as HTMLElement).closest('.folder-item');
    if (folderItem && e.relatedTarget && !folderItem.contains(e.relatedTarget as Node)) {
        folderItem.classList.remove('drag-over');
    }
}

function handleFolderDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer || !e.target) return;

    const dragType = e.dataTransfer.getData('drag-type');
    if (dragType !== 'folder') return;

    const folderId = e.dataTransfer.getData('folder-id');
    const targetElement = (e.target as HTMLElement).closest('.folder-item') as HTMLDivElement;
    if (!targetElement) return;

    const targetFolderId = targetElement.dataset.folderId;

    if (folderId && targetFolderId && folderId !== targetFolderId) {
        // 检查是否试图将文件夹移动到其子文件夹中
        chrome.bookmarks.get(targetFolderId, (targetNodes) => {
            if (targetNodes.length === 0) return;

            chrome.bookmarks.get(folderId, (sourceNodes) => {
                if (sourceNodes.length === 0) return;

                // 检查目标文件夹是否是源文件夹的子文件夹
                chrome.bookmarks.getTree((tree) => {
                    const sourceNode = findNodeInBookmarkTree(tree[0], folderId);
                    if (!sourceNode) return;

                    const isChild = findNodeInTree(sourceNode, targetFolderId);
                    if (isChild) {
                        alert('不能将文件夹移动到其子文件夹中');
                        return;
                    }

                    // 移动文件夹
                    chrome.bookmarks.move(folderId, {
                        parentId: targetFolderId
                    }, () => {
                        // 重新加载文件夹列表
                        loadFolders();
                        // 如果当前显示的是全部书签，则刷新书签列表
                        const activeFolder = document.querySelector('.folder-item.active');
                        if (!activeFolder || activeFolder.textContent === '全部书签') {
                            loadAllBookmarks();
                        }
                    });
                });
            });
        });
    }

    targetElement.classList.remove('drag-over');
}

// 辅助函数：在书签树中查找节点
function findNodeInBookmarkTree(node: Bookmark, targetId: string): Bookmark | null {
    if (node.id === targetId) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeInBookmarkTree(child, targetId);
            if (found) return found;
        }
    }
    return null;
}

function findNodeInTree(node: Bookmark, targetId: string): boolean {
    if (node.id === targetId) return true;
    if (node.children) {
        for (const child of node.children) {
            if (findNodeInTree(child, targetId)) return true;
        }
    }
    return false;
}

// 加载文件夹列表
function loadFolders() {
    chrome.bookmarks.getTree((bookmarkTreeNodes: Bookmark[]) => {
        const folderList = document.getElementById('folderList');
        if (!folderList) return;

        // 保留拖拽提示元素
        const dragHint = folderList.querySelector('.drag-hint');
        if (!dragHint) return;

        folderList.innerHTML = '';
        folderList.appendChild(dragHint);

        // 添加"全部书签"选项
        const allBookmarksEl = document.createElement('div');
        allBookmarksEl.className = 'folder-item active';
        allBookmarksEl.style.paddingLeft = '8px';

        const allBookmarksIcon = document.createElement('span');
        allBookmarksIcon.className = 'folder-icon';
        allBookmarksIcon.textContent = '📚';

        const allBookmarksName = document.createElement('span');
        allBookmarksName.className = 'folder-name';
        allBookmarksName.textContent = '全部书签';

        allBookmarksEl.appendChild(allBookmarksIcon);
        allBookmarksEl.appendChild(allBookmarksName);

        allBookmarksEl.onclick = () => {
            document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
            allBookmarksEl.classList.add('active');
            const titleEl = document.getElementById('currentFolderTitle');
            if (titleEl) {
                titleEl.textContent = '全部书签';
            }
            loadAllBookmarks();
        };

        folderList.appendChild(allBookmarksEl);

        function traverseBookmarkNodes(nodes: Bookmark[], level = 0, parentElement: HTMLElement) {
            nodes.forEach(node => {
                // 跳过根节点，直接处理其子节点
                if (level === 0) {
                    if (node.children) {
                        // 对于书签栏，直接遍历其子节点，保持同一层级
                        if (node.title === "书签栏") {
                            node.children.forEach(child => {
                                if (child.children && child.title && child.title.trim() !== '') {
                                    const folderEl = createFolderElement(child);
                                    folderEl.style.paddingLeft = `20px`;
                                    parentElement.appendChild(folderEl);
                                    // 递归处理子节点
                                    if (child.children) {
                                        traverseBookmarkNodes(child.children, 2, parentElement);
                                    }
                                }
                            });
                        } else {
                            // 对于其他根节点，正常处理
                            traverseBookmarkNodes(node.children, level + 1, parentElement);
                        }
                    }
                    return;
                }

                // 处理文件夹节点
                if (node.children && node.title && node.title.trim() !== '') {
                    const folderEl = createFolderElement(node);
                    folderEl.style.paddingLeft = `${level * 20}px`;
                    parentElement.appendChild(folderEl);
                    // 递归处理子节点
                    traverseBookmarkNodes(node.children, level + 1, parentElement);
                }
            });
        }

        traverseBookmarkNodes(bookmarkTreeNodes, 0, folderList);
    });
}

// 添加暗黑模式切换功能
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
}

// 初始化暗黑模式
function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedDarkMode = localStorage.getItem('darkMode');
    const shouldBeDark = savedDarkMode ? savedDarkMode === 'true' : prefersDark;

    if (shouldBeDark) {
        document.documentElement.classList.add('dark-mode');
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            document.documentElement.classList.toggle('dark-mode', e.matches);
        }
    });

    // 添加按钮点击事件
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// 添加书签相关函数
function showAddBookmarkDialog() {
    const dialog = document.getElementById('addBookmarkDialog');
    const folderSelect = document.getElementById('bookmarkFolder') as HTMLSelectElement;

    // 清空并重新填充文件夹选项
    folderSelect.innerHTML = '';

    // 获取所有文件夹并填充选择框
    chrome.bookmarks.getTree((nodes) => {
        function addFolderOptions(node: Bookmark, level = 0) {
            if (node.children) {
                if (level > 0) { // 跳过根节点
                    const option = document.createElement('option');
                    option.value = node.id;
                    // 使用空格字符进行缩进，并添加文件夹图标
                    option.textContent = '　'.repeat(level - 1) + '📁 ' + node.title;
                    folderSelect.appendChild(option);
                }
                node.children.forEach(child => {
                    if (child.children) { // 只添加文件夹
                        addFolderOptions(child, level + 1);
                    }
                });
            }
        }

        nodes.forEach(node => addFolderOptions(node));
    });

    if (dialog) {
        dialog.classList.add('show');
    }
}

function hideAddBookmarkDialog() {
    const dialog = document.getElementById('addBookmarkDialog');
    if (dialog) {
        dialog.classList.remove('show');
    }
}

function handleAddBookmark() {
    const titleInput = document.getElementById('bookmarkTitle') as HTMLInputElement;
    const urlInput = document.getElementById('bookmarkUrl') as HTMLInputElement;
    const folderSelect = document.getElementById('bookmarkFolder') as HTMLSelectElement;

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const folderId = folderSelect.value;

    if (!title || !url) {
        alert('请填写标题和网址');
        return;
    }

    // 创建书签
    chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: url
    }, () => {
        // 重新加载当前文件夹的书签
        const activeFolder = document.querySelector('.folder-item.active') as HTMLDivElement;
        if (activeFolder?.dataset.folderId) {
            loadBookmarks(activeFolder.dataset.folderId);
        } else {
            loadAllBookmarks();
        }

        // 清空输入框并隐藏对话框
        titleInput.value = '';
        urlInput.value = '';
        hideAddBookmarkDialog();
    });
}

// 初始化添加书签功能
function initAddBookmark() {
    const addButton = document.getElementById('addButton');
    const saveButton = document.getElementById('saveBookmark');
    const cancelButton = document.getElementById('cancelBookmark');

    if (addButton) {
        addButton.addEventListener('click', showAddBookmarkDialog);
    }

    if (saveButton) {
        saveButton.addEventListener('click', handleAddBookmark);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', hideAddBookmarkDialog);
    }
}

// 显示创建文件夹对话框
function showAddFolderDialog() {
    const dialog = document.getElementById('addFolderDialog');
    const parentSelect = document.getElementById('parentFolder') as HTMLSelectElement;

    // 清空并重新填充父文件夹选项
    parentSelect.innerHTML = '';

    // 添加"根目录"选项
    const rootOption = document.createElement('option');
    rootOption.value = '1'; // Chrome 书签栏的 ID
    rootOption.textContent = '📚 书签栏';
    parentSelect.appendChild(rootOption);

    // 获取所有文件夹并填充选择框
    chrome.bookmarks.getTree((nodes) => {
        function addFolderOptions(node: Bookmark, level = 0) {
            if (node.children) {
                if (level > 0 && node.title) { // 跳过根节点，但包含书签栏
                    const option = document.createElement('option');
                    option.value = node.id;
                    option.textContent = '　'.repeat(level - 1) + '📁 ' + node.title;
                    parentSelect.appendChild(option);
                }
                node.children.forEach(child => {
                    if (child.children) { // 只添加文件夹
                        addFolderOptions(child, level + 1);
                    }
                });
            }
        }

        nodes.forEach(node => addFolderOptions(node));
    });

    if (dialog) {
        dialog.classList.add('show');
    }
}

// 隐藏创建文件夹对话框
function hideAddFolderDialog() {
    const dialog = document.getElementById('addFolderDialog');
    if (dialog) {
        dialog.classList.remove('show');
    }
}

// 处理创建文件夹
function handleAddFolder() {
    const nameInput = document.getElementById('folderName') as HTMLInputElement;
    const parentSelect = document.getElementById('parentFolder') as HTMLSelectElement;

    const name = nameInput.value.trim();
    const parentId = parentSelect.value;

    if (!name) {
        alert('请输入文件夹名称');
        return;
    }

    // 创建文件夹
    chrome.bookmarks.create({
        parentId: parentId,
        title: name,
    }, () => {
        // 重新加载文件夹列表
        loadFolders();

        // 清空输入框并隐藏对话框
        nameInput.value = '';
        hideAddFolderDialog();
    });
}

// 初始化创建文件夹功能
function initAddFolder() {
    const addFolderButton = document.getElementById('addFolderButton');
    const saveFolderButton = document.getElementById('saveFolder');
    const cancelFolderButton = document.getElementById('cancelFolder');

    if (addFolderButton) {
        addFolderButton.addEventListener('click', showAddFolderDialog);
    }

    if (saveFolderButton) {
        saveFolderButton.addEventListener('click', handleAddFolder);
    }

    if (cancelFolderButton) {
        cancelFolderButton.addEventListener('click', hideAddFolderDialog);
    }
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;

    let debounceTimer: number;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                searchBookmarks(searchTerm);
            } else {
                // 如果搜索框为空，显示当前选中文件夹的内容或全部书签
                const activeFolder = document.querySelector('.folder-item.active') as HTMLDivElement;
                if (activeFolder?.dataset.folderId) {
                    loadBookmarks(activeFolder.dataset.folderId);
                } else {
                    loadAllBookmarks();
                }
            }
        }, 300); // 300ms 防抖
    });
}

// 搜索书签
function searchBookmarks(searchTerm: string) {
    chrome.bookmarks.search(searchTerm, (results: Bookmark[]) => {
        const container = document.getElementById('bookmarksContainer');
        if (!container) return;

        container.innerHTML = '';

        // 创建搜索结果标题
        const searchTitle = document.createElement('h2');
        searchTitle.textContent = `搜索结果: "${searchTerm}"`;
        container.appendChild(searchTitle);

        // 按文件夹分组搜索结果
        const folderMap = new Map<string, { title: string, bookmarks: Bookmark[] }>();

        // 获取每个书签的父文件夹信息
        const promises = results.map(bookmark => {
            return new Promise<void>((resolve) => {
                if (!bookmark.url) {
                    resolve();
                    return;
                }

                chrome.bookmarks.get(bookmark.parentId || '', (parents) => {
                    if (parents && parents.length > 0) {
                        const parent = parents[0];
                        const folderTitle = parent.title || '未分类';
                        if (!folderMap.has(folderTitle)) {
                            folderMap.set(folderTitle, { title: folderTitle, bookmarks: [] });
                        }
                        folderMap.get(folderTitle)?.bookmarks.push(bookmark);
                    }
                    resolve();
                });
            });
        });

        // 等待所有父文件夹信息获取完成后显示结果
        Promise.all(promises).then(() => {
            if (folderMap.size === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = '未找到匹配的书签';
                container.appendChild(noResults);
                return;
            }

            // 按文件夹分组显示结果
            folderMap.forEach((folder, folderTitle) => {
                if (folder.bookmarks.length > 0) {
                    // 创建文件夹标题
                    const folderHeader = document.createElement('div');
                    folderHeader.className = 'folder-header';
                    folderHeader.innerHTML = `<h3><span class="folder-icon">📁</span> ${folderTitle}</h3>`;
                    container.appendChild(folderHeader);

                    // 创建书签容器
                    const bookmarksWrapper = document.createElement('div');
                    bookmarksWrapper.className = 'bookmarks-wrapper';

                    // 添加书签
                    folder.bookmarks.forEach(bookmark => {
                        const bookmarkEl = createBookmarkElement(bookmark);
                        bookmarksWrapper.appendChild(bookmarkEl);
                    });

                    container.appendChild(bookmarksWrapper);
                }
            });
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initAddBookmark();
    initAddFolder();
    initSearch();
    loadFolders();
    loadAllBookmarks();
});