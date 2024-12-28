# Chrome 书签管理器开发教程

本教程记录了开发 Chrome 书签管理器扩展的完整过程，包括从项目设置到功能实现的详细步骤。

## 目录

1. [项目初始化](#1-项目初始化)
2. [基础功能实现](#2-基础功能实现)
3. [界面优化](#3-界面优化)
4. [高级功能](#4-高级功能)
5. [自动化部署](#5-自动化部署)

## 1. 项目初始化

### 1.1 创建项目结构

```bash
mkdir chrome-bookmark-manager
cd chrome-bookmark-manager
npm init -y
```

### 1.2 安装依赖

```bash
npm install typescript --save-dev
npm install @types/chrome --save-dev
```

### 1.3 配置 TypeScript

创建 `tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist/js"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 1.4 创建项目目录结构

```
.
├── src/
│   ├── js/
│   │   ├── navigation.ts
│   │   ├��─ background.js
│   │   └── popup.js
│   ├── styles/
│   │   ├── navigation.css
│   │   └── popup.css
│   ├── types/
│   │   └── chrome.d.ts
│   ├── navigation.html
│   └── popup.html
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
└── package.json
```

## 2. 基础功能实现

### 2.1 书签管理核心功能

在 `src/js/navigation.ts` 中实现：
- 加载书签列表
- 创建书签元素
- 文件夹树状结构
- 拖拽功能

### 2.2 Chrome API 集成

使用 Chrome Bookmarks API：
- 获取书签树
- 创建书签
- 移动书签
- 删除书签

### 2.3 用户界面交互

实现基本的用户界面功能：
- 点击文件夹加载书签
- 拖拽排序
- 添加/删除书签
- 编辑书签信息

## 3. 界面优化

### 3.1 现代化 UI 设计

- 使用 CSS Grid 和 Flexbox 布局
- 实现响应式设计
- 添加过渡动画
- 优化图标显示

### 3.2 暗黑模式支持

- 实现主题切换
- 配色方案设计
- 自动适应系统主题

### 3.3 交互体验优化

- 添加加载动画
- 优化拖拽反馈
- 改进错误提示
- 添加操作确认

## 4. 高级功能

### 4.1 搜索功能

实现高效的书签搜索：
```typescript
function searchBookmarks(query: string) {
    chrome.bookmarks.search(query, (results) => {
        // 处理搜索结果
        // 按文件夹分组显示
    });
}
```

### 4.2 文件夹管理

添加文件夹操作功能：
```typescript
function createFolder(name: string, parentId: string) {
    chrome.bookmarks.create({
        parentId: parentId,
        title: name
    });
}
```

### 4.3 图标优化

实现多源图标获取：
```typescript
const iconSources = [
    `https://api.faviconkit.com/${hostname}/144`,
    `https://icon.horse/icon/${hostname}`,
    `${url.protocol}//${hostname}/favicon.ico`,
    // 更多备选源
];
```

## 5. 自动化部署

### 5.1 GitHub Actions 配置

创建 `.github/workflows/release.yml`：
```yaml
name: Release Extension

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Build
        run: |
          npm ci
          npm run build:all
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: chrome-bookmark-manager.zip
```

### 5.2 发布流程

1. 更新版本号：
```bash
# 修改 manifest.json 中的 version
git add manifest.json
git commit -m "chore: bump version to x.x.x"
```

2. 创建发布：
```bash
git tag -a vx.x.x -m "Release version x.x.x"
git push origin vx.x.x
```

### 5.3 安装说明

1. 从 Releases 下载
2. 解压缩
3. 在 Chrome 中加载已解压的扩展程序

## 开发技巧

1. 使用 TypeScript 类型检查：
```typescript
interface Bookmark extends chrome.bookmarks.BookmarkTreeNode {
    // 扩展类型定义
}
```

2. CSS 变量实现主题：
```css
:root {
    --primary-color: #2196f3;
    --background-color: #ffffff;
    --text-color: #333333;
}
```

3. 性能优化：
- 使用事件委托
- 延迟加载图标
- 防抖搜索操作

## 调试技巧

1. Chrome 扩展调试：
- 使用 Chrome DevTools
- 查看 background 页面
- 监控网络请求

2. 开发模式：
```typescript
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    console.log('Debug info:', data);
}
```

## 最佳实践

1. 代码组织：
- 功能模块化
- 类型定义清晰
- 注释完善

2. 错误处理：
- 优雅降级
- 用户友好提示
- 日志记录

3. 性能考虑：
- 资源按需加载
- 缓存合理使用
- 避免频繁操作

## 常见问题

1. 权限问题：
- 检查 manifest.json 权限设置
- 确认 API 使用正确

2. 图标加载：
- 使用多个备选源
- 添加加载失败处理
- 实现优雅降级

3. 发布问题：
- GitHub Actions 权限配置
- Release 流程检查
- 版本号管理

## 未来计划

1. 功能增强：
- 批量操作
- 导入导出
- 快捷键支持

2. 性能优化：
- 虚拟滚动
- 更智能的缓存
- 后台同步

3. 用户体验：
- 自定义主题
- 国际化支持
- 更多自定义选项

## 参考资源

1. 官方文档：
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Chrome Bookmarks API](https://developer.chrome.com/docs/extensions/reference/bookmarks/)

2. 开发工具：
- [TypeScript](https://www.typescriptlang.org/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

3. 设计资源：
- [Material Design](https://material.io/)
- [Google Fonts](https://fonts.google.com/)