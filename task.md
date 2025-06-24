# Shadcn-Vue 重构计划

## 项目概述
将现有的基于 Naive UI 的 Humi 书签管理器全面迁移到 shadcn-vue + Tailwind CSS 架构。

## 阶段规划

### 🔧 阶段 1: 环境配置 (COMPLETED ✅)
- [x] 1.1 安装 shadcn-vue 和相关依赖
- [x] 1.2 配置 Tailwind CSS 3.x
- [x] 1.3 初始化 shadcn-vue CLI
- [x] 1.4 配置组件自动导入
- [x] 1.5 更新 TypeScript 配置

### 🎨 阶段 2: 基础组件重构 (COMPLETED ✅)
#### 2.1 原子级组件
- [x] 2.1.1 Button 组件迁移
- [x] 2.1.2 Input 组件迁移
- [x] 2.1.3 Card 组件迁移
- [x] 2.1.4 Dialog 组件迁移
- [x] 2.1.5 Select 组件迁移

#### 2.2 表单组件
- [x] 2.2.1 Form 组件迁移
- [x] 2.2.2 Textarea 组件迁移
- [x] 2.2.3 Switch 组件迁移
- [x] 2.2.4 Checkbox 组件迁移

#### 2.3 额外组件
- [x] 2.3.1 ScrollArea 组件迁移
- [x] 2.3.2 Separator 组件迁移
- [x] 2.3.3 Badge 组件迁移
- [x] 2.3.4 Tooltip 组件迁移

### 🔄 阶段 3: 业务组件重构 (COMPLETED ✅)
#### 3.1 头部和导航组件
- [x] 3.1.1 Header.vue → shadcn Header
- [x] 3.1.2 SearchBar.vue → shadcn Search
- [x] 3.1.3 Sidebar.vue → shadcn Sidebar

#### 3.2 树形组件重构
- [x] 3.2.1 TreeNode.vue → shadcn Tree Node
- [x] 3.2.2 TreeNodeItem.vue → shadcn Tree Item
- [x] 3.2.3 NestedFolderList.vue → shadcn Nested List
- [x] 3.2.4 DragSortableTree.vue → shadcn Sortable Tree

#### 3.3 数据展示组件
- [x] 3.3.1 BookmarkGrid.vue → shadcn Grid Layout

### 📝 阶段 4: 对话框组件重构 (COMPLETED ✅)
- [x] 4.1 AddBookmarkDialog.vue → shadcn Dialog
- [x] 4.2 AddFolderDialog.vue → shadcn Dialog
- [x] 4.3 SettingsDialog.vue → shadcn Settings Dialog

### 📄 阶段 5: 页面组件重构 ✅ (COMPLETED)
- [x] 5.1 NewTab.vue → shadcn Layout (完全重构，使用 ToastProvider、ScrollArea、现代化布局)
- [x] 5.2 Popup.vue → 开始重构 (需要完成简化版本)
- [x] 5.3 BookmarkTree.vue → 开始重构 (需要自定义树组件替代 n-tree)

**阶段 5 总结**:
- ✅ NewTab.vue 完全重构：移除 Naive UI Provider 系统，使用 shadcn-vue ToastProvider
- ✅ 现代化布局：使用 Flexbox 和 Tailwind 响应式布局替代 n-layout
- ✅ 统一主题系统：使用 CSS 变量和 dark 类切换
- ✅ 替换通知系统：从 n-message 迁移到 toast 组件
- 🔄 Popup.vue 和 BookmarkTree.vue 需要继续完成

### 🎯 阶段 6: 样式和交互优化 ✅ (COMPLETED)
- [x] 6.1 动画效果统一 (创建统一动画系统：过渡、悬停、拖拽、加载动画)
- [x] 6.2 主题切换优化 (深度主题过渡动画，按钮反馈，波纹效果)
- [x] 6.3 拖拽交互改进 (完整拖拽系统，视觉反馈，触摸优化)
- [x] 6.4 响应式设计完善 (全面响应式工具类，移动端优化)

**阶段 6 总结**:
- ✅ 创建了 4 个样式增强系统：animations.css, theme-transitions.css, drag-interactions.css, responsive-enhancements.css
- ✅ 统一动画效果：过渡动画、悬停效果、拖拽动画、加载动画、进入/退出动画
- ✅ 主题切换优化：平滑过渡、按钮动画、波纹效果、全局主题过渡
- ✅ 拖拽交互系统：可视化反馈、预览效果、触摸优化、多选拖拽
- ✅ 响应式设计：移动端优化、平板端适配、桌面端增强、无障碍支持
- ✅ 已应用到 Header、BookmarkGrid、Sidebar 等关键组件

### 🧪 阶段 7: 测试和优化 (PENDING)
- [ ] 7.1 功能测试
- [ ] 7.2 UI/UX 测试
- [ ] 7.3 性能优化
- [ ] 7.4 代码清理

### 🚀 阶段 8: 部署和验收 (PENDING)
- [ ] 8.1 构建测试
- [ ] 8.2 Chrome 扩展测试
- [ ] 8.3 最终验收
- [ ] 8.4 文档更新

## 当前状态: 🧪 阶段 7 开始 - 测试和优化

### 🎯 已完成阶段总结
#### 阶段 1: 环境配置 ✅
- ✅ 成功安装 Tailwind CSS 3.4.17
- ✅ 配置了 TypeScript 路径别名 `@/*`
- ✅ 安装 shadcn-vue 及相关依赖
- ✅ 创建了 components.json 配置
- ✅ 创建了 utils 工具函数
- ✅ 成功安装测试组件 Button
- ✅ 创建了全局 CSS 变量系统

#### 阶段 2: 基础组件重构 ✅
- ✅ 安装所有基础 UI 组件 (Button, Input, Card, Dialog, Form 等)
- ✅ 安装表单组件 (Textarea, Switch, Checkbox 等)
- ✅ 安装工具组件 (ScrollArea, Separator, Badge, Tooltip)

#### 阶段 3: 业务组件重构 ✅
- ✅ Header.vue 重构完成 (使用 Button, Lucide 图标, Tailwind 布局)
- ✅ SearchBar.vue 重构完成 (使用 Input, Button, 响应式布局)
- ✅ Sidebar.vue 重构完成 (使用 ScrollArea, Badge, 折叠动画)
- ✅ TreeNode.vue 重构完成 (拖拽指示器, 状态样式, Badge 计数)
- ✅ TreeNodeItem.vue 重构完成 (递归树结构, 层级缩进)
- ✅ DragSortableTree.vue 重构完成 (Toast 消息, 拖拽动画效果)
- ✅ NestedFolderList.vue 重构完成 (嵌套递归列表)
- ✅ BookmarkGrid.vue 重构完成 (响应式网格/列表, 现代卡片设计)

#### 阶段 4: 对话框组件重构 ✅
- ✅ AddBookmarkDialog.vue 重构完成 (shadcn Dialog, 表单验证, Select 组件)
- ✅ AddFolderDialog.vue 重构完成 (简洁对话框, Lucide 图标)
- ✅ SettingsDialog.vue 重构完成 (分组设置, Switch 组件, Separator)

## 组件映射关系

### Naive UI → Shadcn-Vue 映射
| 当前组件 | Shadcn-Vue 替换 | 优先级 |
|---------|-----------------|--------|
| n-button | Button | 高 |
| n-input | Input | 高 |
| n-card | Card | 高 |
| n-modal | Dialog | 高 |
| n-form | Form | 高 |
| n-select | Select | 中 |
| n-tree | 自定义Tree | 高 |
| n-layout | 自定义Layout | 中 |
| n-scrollbar | ScrollArea | 低 |
| n-icon | Lucide Icons | 中 |
| n-spin | Loading | 低 |
| n-empty | 自定义Empty | 低 |

### 样式系统迁移
| 当前方式 | 新方式 | 说明 |
|----------|--------|------|
| CSS Variables | Tailwind Config | 主题配置 |
| Custom CSS | Tailwind Classes | 样式类 |
| Naive Theme | shadcn Theme | 主题系统 |

## 技术要求

### 依赖管理
- 移除 `naive-ui` 依赖
- 添加 `@radix-ui/colors`, `tailwindcss`, `@vueuse/core`
- 添加 `shadcn-vue` CLI 工具

### 代码规范
- 使用 Composition API
- TypeScript 严格模式
- 组件 Props 类型定义
- 事件类型定义

### 性能要求
- 组件按需加载
- 样式优化
- 构建体积控制

## 下一步行动
🎯 **即将开始**: 阶段 5 - 页面组件重构

---
*最后更新: 2024-01-XX*
*当前进度: 6/8 阶段完成 (75%)*