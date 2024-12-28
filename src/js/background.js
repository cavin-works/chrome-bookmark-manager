/// <reference path="../types/chrome.d.ts" />

// 监听书签变化
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    notifyBookmarkChange('created', id, bookmark);
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    notifyBookmarkChange('removed', id, removeInfo);
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    notifyBookmarkChange('changed', id, changeInfo);
});

chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
    notifyBookmarkChange('moved', id, moveInfo);
});

// 通知书签变化
function notifyBookmarkChange(type, id, info) {
    chrome.runtime.sendMessage({
        type: 'bookmarkChange',
        changeType: type,
        bookmarkId: id,
        details: info
    });
}

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: 'navigation.html'
    });
});