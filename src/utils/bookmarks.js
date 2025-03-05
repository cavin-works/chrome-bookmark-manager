// 书签操作相关的核心功能
class BookmarkManager {
    // 获取所有书签
    async getAllBookmarks() {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.getTree(async (tree) => {
                try {
                    const bookmarks = [];
                    
                    // 递归遍历书签树
                    const traverse = (nodes) => {
                        for (const node of nodes) {
                            if (node.url) {
                                // 这是一个书签
                                bookmarks.push({
                                    id: node.id,
                                    title: node.title,
                                    url: node.url,
                                    parentId: node.parentId,
                                    dateAdded: node.dateAdded
                                });
                            }
                            if (node.children) {
                                // 继续遍历子节点
                                traverse(node.children);
                            }
                        }
                    };
                    
                    traverse(tree);
                    resolve(bookmarks);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    
    // 创建新书签
    async createBookmark(title, url, parentId) {
        return new Promise((resolve) => {
            chrome.bookmarks.create({
                title,
                url,
                parentId
            }, resolve);
        });
    }
    
    // 移动书签到新目录
    async moveBookmark(id, newParentId) {
        return new Promise((resolve) => {
            chrome.bookmarks.move(id, {
                parentId: newParentId
            }, resolve);
        });
    }
    
    // 创建新目录
    async createFolder(title, parentId) {
        return new Promise((resolve) => {
            chrome.bookmarks.create({
                title,
                parentId
            }, resolve);
        });
    }

    // 搜索书签或文件夹
    async searchBookmarks({ title, parentId }) {
        return new Promise((resolve) => {
            chrome.bookmarks.getChildren(parentId, (children) => {
                const results = children.filter(item => 
                    item.title === title && (!item.url || item.url === undefined)
                );
                resolve(results);
            });
        });
    }

    // 获取所有文件夹
    async getAllFolders() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree(async (tree) => {
                const folders = [];
                
                // 递归获取所有文件夹
                const traverseTree = (node, path = '') => {
                    if (!node.url) { // 如果没有url属性，说明是文件夹
                        if (node.title) { // 排除根节点
                            const fullPath = path ? `${path}/${node.title}` : node.title;
                            folders.push({
                                id: node.id,
                                title: node.title,
                                path: fullPath
                            });
                            path = fullPath;
                        }
                        if (node.children) {
                            node.children.forEach(child => traverseTree(child, path));
                        }
                    }
                };
                
                tree.forEach(root => traverseTree(root));
                resolve(folders);
            });
        });
    }
}

export { BookmarkManager }; 