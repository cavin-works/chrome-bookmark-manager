# 样式文件结构说明

## 目录结构

```
src/styles/
├── index.css          # 样式索引文件，统一导入所有样式
├── common.css         # 通用样式，包含CSS变量、工具类等
├── newtab.css         # 新标签页专用样式
└── README.md          # 样式文档说明
```

## 文件说明

### index.css
样式索引文件，统一管理所有样式的导入。通过这个文件可以：
- 统一管理样式依赖
- 控制样式加载顺序
- 方便样式模块化管理

### common.css
通用样式文件，包含：
- CSS变量定义（颜色、间距、字体等）
- 基础重置样式
- 通用工具类（布局、间距、颜色等）
- 响应式工具类
- 动画类
- 滚动条样式
- 焦点和选择样式

### newtab.css
新标签页专用样式，包含：
- 容器样式
- 头部样式
- 侧边栏样式
- 内容区域样式
- 搜索栏样式
- 书签卡片样式
- 按钮样式
- 模态框样式
- 表单样式
- 深色主题样式
- 响应式设计

## 使用方式

### 在Vue组件中使用
```vue
<style>
@import '../styles/index.css';
</style>
```

### 在HTML文件中使用
```html
<link rel="stylesheet" href="../styles/index.css">
```

## CSS变量

项目使用CSS变量来管理主题和样式，主要变量包括：

### 颜色变量
- `--primary-color`: 主色调
- `--secondary-color`: 次要色调
- `--success-color`: 成功色
- `--warning-color`: 警告色
- `--danger-color`: 危险色
- `--info-color`: 信息色

### 背景颜色
- `--bg-primary`: 主背景色
- `--bg-secondary`: 次要背景色
- `--bg-dark`: 深色背景
- `--bg-darker`: 更深色背景

### 文字颜色
- `--text-primary`: 主要文字色
- `--text-secondary`: 次要文字色
- `--text-light`: 浅色文字
- `--text-muted`: 静音文字色

### 间距变量
- `--spacing-xs`: 超小间距 (0.25rem)
- `--spacing-sm`: 小间距 (0.5rem)
- `--spacing-md`: 中等间距 (1rem)
- `--spacing-lg`: 大间距 (1.5rem)
- `--spacing-xl`: 超大间距 (2rem)
- `--spacing-xxl`: 极大间距 (3rem)

### 字体大小
- `--font-size-xs`: 超小字体 (0.75rem)
- `--font-size-sm`: 小字体 (0.875rem)
- `--font-size-base`: 基础字体 (1rem)
- `--font-size-lg`: 大字体 (1.125rem)
- `--font-size-xl`: 超大字体 (1.25rem)
- `--font-size-xxl`: 极大字体 (1.5rem)

### 圆角
- `--border-radius-sm`: 小圆角 (4px)
- `--border-radius`: 基础圆角 (8px)
- `--border-radius-lg`: 大圆角 (12px)
- `--border-radius-xl`: 超大圆角 (16px)

### 阴影
- `--shadow-sm`: 小阴影
- `--shadow-md`: 中等阴影
- `--shadow-lg`: 大阴影

### 过渡动画
- `--transition-fast`: 快速过渡 (0.15s)
- `--transition-base`: 基础过渡 (0.3s)
- `--transition-slow`: 慢速过渡 (0.5s)

## 工具类

项目提供了丰富的工具类，包括：

### 布局类
- `.d-flex`, `.d-block`, `.d-none` 等显示类
- `.flex-row`, `.flex-column` 等弹性布局类
- `.justify-content-*`, `.align-items-*` 等对齐类

### 间距类
- `.m-*`, `.p-*` 等边距和内边距类
- `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*` 等方向边距类
- `.pt-*`, `.pb-*`, `.pl-*`, `.pr-*` 等方向内边距类

### 颜色类
- `.text-primary`, `.text-secondary` 等文字颜色类
- `.bg-primary`, `.bg-secondary` 等背景颜色类

### 其他工具类
- `.rounded`, `.shadow` 等装饰类
- `.position-*` 等定位类
- `.opacity-*` 等透明度类

## 主题支持

项目支持浅色和深色主题，通过CSS变量实现主题切换：

```css
/* 浅色主题（默认） */
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  /* ... */
}

/* 深色主题 */
[data-theme="dark"] {
  --bg-primary: #2c3e50;
  --text-primary: #ffffff;
  /* ... */
}
```

## 响应式设计

项目使用移动优先的响应式设计，主要断点：
- 576px (sm)
- 768px (md)
- 992px (lg)
- 1200px (xl)

## 扩展建议

### 添加新组件样式
1. 在 `src/styles/components/` 目录下创建组件样式文件
2. 在 `index.css` 中导入新组件样式
3. 使用CSS变量保持样式一致性

### 添加新主题
1. 在 `src/styles/themes/` 目录下创建主题样式文件
2. 在 `index.css` 中导入新主题样式
3. 通过JavaScript动态切换主题

### 优化建议
1. 使用CSS变量保持样式一致性
2. 合理使用工具类减少重复代码
3. 遵循移动优先的响应式设计原则
4. 保持样式的模块化和可维护性