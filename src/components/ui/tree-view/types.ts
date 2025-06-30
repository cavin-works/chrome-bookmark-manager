// https://github.com/neigebaie/shadcn-ui-tree-view/blob/main/components/tree-view.tsx
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
  icon?: Function;
  action: (items: TreeViewItem[]) => void;
}
export interface TreeViewIconMap {
  [key: string]: Function | undefined;
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
  getIcon?: (item: TreeViewItem, depth: number) => Function;
  onSelectionChange?: (selectedItems: TreeViewItem[]) => void;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void;
  iconMap?: TreeViewIconMap;
  menuItems?: TreeViewMenuItem[];
}