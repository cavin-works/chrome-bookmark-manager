// https://github.com/neigebaie/shadcn-ui-tree-view/blob/main/components/tree-view.tsx
import type { Component } from 'vue'

export interface TreeViewItem {
  id: string;
  name: string;
  type: string;
  children?: TreeViewItem[];
  checked?: boolean;
}

export interface TreeViewMenuItem {
  id: string;
  label: string;
  icon?: Component | string;
  action: (items: TreeViewItem[]) => void;
}

export interface TreeViewIconMap {
  [key: string]: Component | string | undefined;
}

export interface TreeViewProps {
  className?: string;
  data: TreeViewItem[];
  title?: string;
  showExpandAll?: boolean;
  showCheckboxes?: boolean;
  checkboxPosition?: "left" | "right";
  searchPlaceholder?: string;
  selectionText?: string;
  checkboxLabels?: {
    check: string;
    uncheck: string;
  };
  getIcon?: (item: TreeViewItem, depth: number) => Component | string;
  onSelectionChange?: (selectedItems: TreeViewItem[]) => void;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void;
  iconMap?: TreeViewIconMap;
  menuItems?: TreeViewMenuItem[];
}

export interface TreeItemProps {
  item: TreeViewItem;
  depth?: number;
  selectedIds: Set<string>;
  lastSelectedId: { value: string | null };
  onSelect: (ids: Set<string>) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string, isOpen: boolean) => void;
  getIcon?: (item: TreeViewItem, depth: number) => Component | string;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onAccessChange?: (item: TreeViewItem, hasAccess: boolean) => void;
  allItems: TreeViewItem[];
  showAccessRights?: boolean;
  itemMap: Map<string, TreeViewItem>;
  iconMap?: TreeViewIconMap;
  menuItems?: TreeViewMenuItem[];
  getSelectedItems: () => TreeViewItem[];
}

// 选择状态类型
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  dragStart: number | null;
  dragStartPosition: { x: number; y: number } | null;
  currentMousePos: number;
}

// 搜索状态接口
export interface SearchState {
  query: string;
  filteredData: TreeViewItem[];
  expandedIds: Set<string>;
}

// 选择系统接口
export interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}

// 工具函数类型
export type ItemMapBuilder = (items: TreeViewItem[]) => Map<string, TreeViewItem>;
export type CheckStateGetter = (item: TreeViewItem, itemMap: Map<string, TreeViewItem>) => CheckState;
export type VisibleItemsGetter = (items: TreeViewItem[], expandedIds: Set<string>) => TreeViewItem[];