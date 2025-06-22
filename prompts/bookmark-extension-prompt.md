# 浏览器书签管理插件开发提示词

## 项目概述
开发一个功能完整的浏览器书签管理插件，支持书签的增删改查、AI自动分类和图标自动获取功能。插件将在新标签页中展示现代化的书签管理界面。

## 技术栈要求
- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite + vite-plugin-web-extension
- **浏览器API**: Chrome Extensions API / WebExtension API
- **UI组件**: 现代化设计，支持响应式布局
- **AI集成**: 集成AI服务进行书签自动分类

## 核心功能需求

### 1. 书签管理功能
- **查看书签**: 以网格/列表形式展示所有书签，支持搜索和筛选
- **编辑书签**: 支持修改书签标题、URL、描述等信息
- **删除书签**: 支持单个删除和批量删除
- **新增书签**: 支持手动添加书签，包含标题、URL、描述等字段
- **书签导入/导出**: 支持书签数据的备份和恢复

### 2. AI智能分类功能
- **自动分类**: 基于书签标题、URL和描述内容进行AI分析，自动归类到合适的文件夹
- **分类建议**: 为用户提供分类建议，允许用户确认或修改
- **分类管理**: 支持创建、重命名、删除书签文件夹
- **智能标签**: 为书签自动生成相关标签

### 3. 图标自动获取功能
- **网站图标获取**: 自动从网站获取favicon作为书签图标
- **图标缓存**: 本地缓存图标，提高加载速度
- **图标回退**: 当无法获取网站图标时，使用默认图标或生成文字图标
- **图标管理**: 支持手动更换书签图标

## 界面设计要求

### 新标签页界面
- **现代化设计**: 使用Material Design或类似设计语言
- **响应式布局**: 适配不同屏幕尺寸
- **深色/浅色主题**: 支持主题切换
- **搜索栏**: 顶部搜索框，支持实时搜索
- **分类导航**: 左侧分类树形结构
- **书签网格**: 主要区域展示书签卡片
- **工具栏**: 包含添加、导入、设置等操作按钮

### 书签卡片设计
- **图标显示**: 显示网站图标或默认图标
- **标题和URL**: 清晰显示书签信息
- **操作菜单**: 悬停显示编辑、删除等操作
- **标签显示**: 显示AI生成的标签
- **分类标识**: 显示所属文件夹

## 技术实现要点

### 1. 浏览器API集成
```typescript
// 书签API使用示例
import { browser } from 'webextension-polyfill';

// 获取所有书签
const bookmarks = await browser.bookmarks.getTree();

// 创建书签
const newBookmark = await browser.bookmarks.create({
  parentId: folderId,
  title: '书签标题',
  url: 'https://example.com'
});

// 删除书签
await browser.bookmarks.remove(bookmarkId);
```

### 2. AI分类服务集成
- 集成OpenAI API或其他AI服务
- 实现书签内容分析算法
- 建立分类规则和权重系统
- 支持用户反馈优化分类准确性

### 3. 图标获取服务
```typescript
// 图标获取逻辑
async function getFavicon(url: string): Promise<string> {
  try {
    const domain = new URL(url).hostname;
    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    // 验证图标是否存在
    const response = await fetch(iconUrl);
    return response.ok ? iconUrl : defaultIcon;
  } catch {
    return defaultIcon;
  }
}
```

### 4. 数据存储
- 使用Chrome Storage API存储用户设置和缓存数据
- 实现数据同步和备份功能
- 支持书签数据的导入导出

## 文件结构建议
```
src/
├── components/
│   ├── BookmarkCard.vue          # 书签卡片组件
│   ├── BookmarkGrid.vue          # 书签网格组件
│   ├── CategoryTree.vue          # 分类树组件
│   ├── SearchBar.vue             # 搜索栏组件
│   └── Settings.vue              # 设置面板组件
├── services/
│   ├── bookmarkService.ts        # 书签管理服务
│   ├── aiService.ts              # AI分类服务
│   ├── iconService.ts            # 图标获取服务
│   └── storageService.ts         # 数据存储服务
├── utils/
│   ├── constants.ts              # 常量定义
│   ├── helpers.ts                # 工具函数
│   └── types.ts                  # TypeScript类型定义
├── pages/
│   ├── NewTab.vue                # 新标签页主界面
│   └── Popup.vue                 # 弹出窗口
├── background.ts                 # 后台脚本
└── manifest.json                 # 插件清单
```

## 开发步骤建议

### 1. 基础架构搭建
- 配置Vite和WebExtension插件构建
- 设置Vue 3 + TypeScript开发环境
- 创建基础组件结构

### 2. 核心功能实现
- 实现书签的增删改查功能
- 集成浏览器书签API
- 实现数据存储和同步

### 3. AI功能集成
- 集成AI服务API
- 实现书签内容分析算法
- 开发分类建议系统

### 4. 图标系统实现
- 实现图标自动获取功能
- 建立图标缓存机制
- 处理图标加载失败情况

### 5. UI界面开发
- 设计现代化界面
- 实现响应式布局
- 添加主题切换功能

### 6. 测试和优化
- 功能测试和bug修复
- 性能优化
- 用户体验改进

## 权限配置
在manifest.json中需要配置以下权限：
```json
{
  "permissions": [
    "bookmarks",
    "storage",
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ]
}
```

## 注意事项
- 确保插件权限配置正确（书签、存储、网络等）
- 实现错误处理和用户友好的错误提示
- 考虑隐私保护，AI分析数据的安全处理
- 优化性能，特别是大量书签时的加载速度
- 提供详细的使用说明和帮助文档

## 扩展功能建议
- 书签使用统计和分析
- 书签分享功能
- 多设备同步
- 书签备份到云端
- 自定义主题和布局
- 快捷键支持
- 书签导入导出多种格式支持