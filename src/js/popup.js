/// <reference path="../types/chrome.d.ts" />

document.addEventListener('DOMContentLoaded', () => {
    // 直接打开新标签页并关闭弹出窗口
    chrome.tabs.create({ url: 'navigation.html' });
    window.close();
});