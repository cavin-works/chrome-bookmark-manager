# 样式系统文档

## 概述

本项目采用基于 Tailwind CSS 的样式系统，通过精心设计的文件结构实现样式的模块化管理。

## 文件结构

```
src/styles/
├── index.css         # 样式入口文件
├── base.css          # 基础样式和全局重置
├── components.css    # 可复用的交互组件
├── pages.css         # 页面特定布局和样式
└── overrides.css     # 必要的样式覆盖
```

## 文件说明

### index.css
样式系统的入口文件，按照正确的顺序导入所有样式文件。

### base.css - 基础样式
**全局副作用：** 影响所有元素的基础样式

包含内容：
- Tailwind CSS 基础导入
- CSS 变量定义（主题色彩、间距、动画等）
- 全局重置样式
- 深色模式配置

### components.css - 交互组件
**全局副作用：** 定义可在多个组件中使用的样式类

包含内容：
- 主题切换组件（`.theme-transition`, `.theme-toggle`）
- 拖拽交互组件（`.draggable-item`, `.drop-indicator`）
- 悬停效果组件（`.hover-lift`, `.hover-glow`）
- 文件夹项目样式（`.folder-item`）
- 过渡动画类（`.transition-smooth`, `.transition-fast`）

### pages.css - 页面布局
**全局副作用：** 定义页面级别的布局结构

包含内容：
- 新标签页布局（`.newtab-container`, `.newtab-header`）
- 搜索栏布局（`.search-bar`, `.search-section`）
- 书签网格布局（`.bookmarks-grid`, `.bookmark-card`）
- 侧边栏结构（`.sidebar-tree`, `.all-bookmarks-section`）
- 响应式设计

### overrides.css - 样式覆盖
**全局副作用：** 使用高特异性选择器覆盖特定组件样式

包含内容：
- 侧边栏树形组件覆盖
- 特殊交互覆盖（`.no-drag`, `.drag-smooth`）
- 无障碍和性能优化

## 使用指南

### 在 Vue 组件中使用
```vue
<style>
@import '../styles/index.css';
</style>
```

### 在 HTML 文件中使用
```html
<link rel="stylesheet" href="../styles/index.css">
```

## 样式类说明

### 主题相关
- `.theme-transition` - 主题切换过渡动画
- `.theme-toggle` - 主题切换按钮

### 拖拽交互
- `.draggable-item` - 可拖拽元素
- `.drop-indicator` - 拖拽指示器
- `.folder-item` - 文件夹项目样式

### 悬停效果
- `.hover-lift` - 悬停上升效果
- `.hover-glow` - 悬停发光效果

### 过渡动画
- `.transition-smooth` - 平滑过渡（200ms）
- `.transition-fast` - 快速过渡（100ms）
- `.transition-slow` - 慢速过渡（300ms）

### 页面布局
- `.newtab-container` - 新标签页主容器
- `.bookmarks-grid` - 书签网格布局
- `.bookmark-card` - 书签卡片

## 全局副作用说明

### 1. 基础样式（base.css）
- **作用范围：** 全局所有元素
- **副作用：** 重置默认样式，设置全局字体和颜色
- **注意：** 影响整个应用的基础外观

### 2. 组件样式（components.css）
- **作用范围：** 使用特定类名的元素
- **副作用：** 定义动画关键帧，可能影响同名动画
- **注意：** 确保类名唯一性，避免冲突

### 3. 页面样式（pages.css）
- **作用范围：** 特定页面的布局元素
- **副作用：** 定义页面级别的布局结构
- **注意：** 主要用于新标签页，对其他页面影响最小

### 4. 覆盖样式（overrides.css）
- **作用范围：** 特定组件和元素
- **副作用：** 使用高特异性选择器，可能影响样式优先级
- **注意：** 谨慎使用，避免过度覆盖

## 性能优化

### 1. 无障碍支持
- 所有动画都支持 `prefers-reduced-motion` 媒体查询
- 支持高对比度模式
- 支持屏幕阅读器

### 2. 性能优化
- 使用 CSS 层级（@layer）管理样式优先级
- 最小化重复样式定义
- 优化选择器性能

## 维护指南

### 1. 添加新样式
- 组件样式添加到 `components.css`
- 页面样式添加到 `pages.css`
- 避免在 `overrides.css` 中添加新样式

### 2. 修改现有样式
- 优先使用 Tailwind 工具类
- 必要时在对应的样式文件中修改
- 避免使用 `!important`

### 3. 删除样式
- 确认样式未被使用后再删除
- 保持文件结构的完整性

## 最佳实践

1. **优先使用 Tailwind 类**：避免编写自定义 CSS
2. **明确全局副作用**：了解每个样式文件的影响范围
3. **遵循导入顺序**：确保样式正确应用
4. **使用语义化类名**：便于维护和理解
5. **支持无障碍**：确保所有用户都能正常使用

## 故障排除

### 样式未生效
1. 检查导入顺序是否正确
2. 确认 Tailwind 类名拼写
3. 检查 CSS 层级覆盖

### 性能问题
1. 检查是否有不必要的动画
2. 确认 `prefers-reduced-motion` 支持
3. 优化选择器复杂度

### 主题切换问题
1. 检查 CSS 变量定义
2. 确认深色模式配置
3. 验证主题切换逻辑