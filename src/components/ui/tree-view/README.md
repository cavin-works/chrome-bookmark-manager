# TreeView 组件

一个功能完整的 Vue 3 树形视图组件，基于 shadcn-vue 构建。

## 特性

- ✅ **完整选择系统**：单选、多选、范围选择（Shift）、多选（Ctrl/Cmd）
- ✅ **拖拽选择**：可视化拖拽框选择多个项目
- ✅ **实时搜索**：搜索过滤、自动展开匹配项
- ✅ **复选框系统**：三态复选框（选中、未选中、半选中）
- ✅ **展开折叠**：支持全部展开/折叠、单个节点展开/折叠
- ✅ **动画效果**：平滑的展开/折叠动画、选择状态过渡
- ✅ **自定义图标**：支持图标映射和自定义图标函数
- ✅ **类型安全**：完整的 TypeScript 类型定义

## 快速开始

### 基础用法

```vue
<template>
  <TreeView
    :data="treeData"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TreeView } from '@/components/ui/tree-view'
import type { TreeViewItem } from '@/components/ui/tree-view'

const treeData = ref<TreeViewItem[]>([
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    children: [
      { id: '1-1', name: 'file1.txt', type: 'file' },
      { id: '1-2', name: 'file2.txt', type: 'file' }
    ]
  }
])

function handleSelectionChange(items: TreeViewItem[]) {
  console.log('Selected items:', items)
}
</script>
```

### 完整配置

```vue
<template>
  <TreeView
    :data="treeData"
    title="文件系统"
    :show-expand-all="true"
    :show-checkboxes="true"
    search-placeholder="搜索文件..."
    selection-text="个文件已选择"
    :checkbox-labels="{ check: '全选', uncheck: '取消全选' }"
    :icon-map="iconMap"
    :menu-items="menuItems"
    :get-icon="getCustomIcon"
    @selection-change="handleSelectionChange"
    @check-change="handleCheckChange"
    @action="handleAction"
  />
</template>

<script setup lang="ts">
import { Folder, File, Image } from 'lucide-vue-next'

const iconMap = {
  folder: Folder,
  file: File,
  image: Image
}

const menuItems = [
  {
    id: 'open',
    label: '打开',
    icon: File,
    action: (items) => console.log('Open', items)
  }
]

function getCustomIcon(item: TreeViewItem, depth: number) {
  if (depth > 2) return File
  return iconMap[item.type] || File
}
</script>
```

## 组件属性

### TreeViewProps

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `TreeViewItem[]` | **必需** | 树形数据 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `title` | `string` | `''` | 树标题 |
| `showExpandAll` | `boolean` | `true` | 显示展开/折叠全部按钮 |
| `showCheckboxes` | `boolean` | `false` | 显示复选框 |
| `searchPlaceholder` | `string` | `'Search...'` | 搜索框占位符 |
| `selectionText` | `string` | `'selected'` | 选择状态文本 |
| `checkboxLabels` | `object` | `{check: 'Check', uncheck: 'Uncheck'}` | 复选框按钮文本 |
| `iconMap` | `TreeViewIconMap` | - | 图标映射对象 |
| `menuItems` | `TreeViewMenuItem[]` | - | 右键菜单项 |
| `getIcon` | `function` | - | 自定义图标函数 |

### TreeViewItem

```typescript
interface TreeViewItem {
  id: string;           // 唯一标识符
  name: string;         // 显示名称
  type: string;         // 节点类型
  children?: TreeViewItem[];  // 子节点
  checked?: boolean;    // 复选框状态
}
```

## 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `selection-change` | `(items: TreeViewItem[])` | 选择状态改变 |
| `check-change` | `(item: TreeViewItem, checked: boolean)` | 复选框状态改变 |
| `action` | `(action: string, items: TreeViewItem[])` | 菜单动作触发 |

## 快捷键

- **点击**：单选项目
- **Ctrl/Cmd + 点击**：多选项目
- **Shift + 点击**：范围选择
- **拖拽**：框选多个项目
- **双击文件夹**：展开/折叠

## 测试

运行测试页面：

```bash
pnpm run test:tree-view
```

或访问：`http://localhost:5173/src/test-tree-view.html`

## 类型定义

完整的类型定义请参考 `types.ts` 文件。