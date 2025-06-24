import { Component } from 'vue';

// Ionicons5 图标
import {
  SearchOutline,
  BookmarkOutline,
  BookmarksOutline,
  FolderOutline,
  FolderOpenOutline,
  AddOutline,
  SettingsOutline,
  SunnyOutline,
  MoonOutline,
  GridOutline,
  ListOutline,
  CloseOutline,
  CreateOutline,
  TrashOutline,
  HomeOutline,
  LinkOutline,
  PricetagOutline,
  ChevronDownOutline,
  ChevronUpOutline,
  ChevronForwardOutline,
  ChevronBackOutline,
  RefreshOutline,
  ShareOutline,
  CopyOutline,
  CheckmarkOutline,
  AlertCircleOutline,
  InformationCircleOutline,
  WarningOutline
} from '@vicons/ionicons5';

// Tabler 图标
import {
  World,
  Star,
  Heart,
  Download,
  Upload,
  Filter,
  Menu,
  Dots,
  DotsVertical,
  ExternalLink
} from '@vicons/tabler';

// 导出常用图标
export const icons = {
  // 基础图标
  search: SearchOutline,
  bookmark: BookmarkOutline,
  bookmarks: BookmarksOutline,
  folder: FolderOutline,
  folderOpen: FolderOpenOutline,
  add: AddOutline,
  settings: SettingsOutline,
  close: CloseOutline,
  edit: CreateOutline,
  delete: TrashOutline,
  home: HomeOutline,
  link: LinkOutline,
  tag: PricetagOutline,

  // 主题图标
  sun: SunnyOutline,
  moon: MoonOutline,

  // 布局图标
  grid: GridOutline,
  list: ListOutline,

  // 导航图标
  chevronDown: ChevronDownOutline,
  chevronUp: ChevronUpOutline,
  chevronForward: ChevronForwardOutline,
  chevronBack: ChevronBackOutline,

  // 动作图标
  refresh: RefreshOutline,
  share: ShareOutline,
  copy: CopyOutline,
  check: CheckmarkOutline,

  // 状态图标
  alert: AlertCircleOutline,
  info: InformationCircleOutline,
  warning: WarningOutline,

  // 其他图标
  world: World,
  star: Star,
  starFilled: Star, // 使用普通 Star 图标替代
  heart: Heart,
  heartFilled: Heart, // 使用普通 Heart 图标替代
  download: Download,
  upload: Upload,
  filter: Filter,
  sort: Menu, // 使用 Menu 图标替代
  menu: Menu,
  dots: Dots,
  dotsVertical: DotsVertical,
  externalLink: ExternalLink
} as Record<string, Component>;

// 图标渲染辅助函数（简化版，直接返回图标组件）
export function renderIcon(icon: Component) {
  return () => h(icon);
}

// 快捷图标组件（简化版，不使用 NIcon 包装）
export const IconComponents = {
  Search: () => h(SearchOutline),
  Bookmark: () => h(BookmarkOutline),
  Bookmarks: () => h(BookmarksOutline),
  Folder: () => h(FolderOutline),
  FolderOpen: () => h(FolderOpenOutline),
  Add: () => h(AddOutline),
  Settings: () => h(SettingsOutline),
  Sun: () => h(SunnyOutline),
  Moon: () => h(MoonOutline),
  Grid: () => h(GridOutline),
  List: () => h(ListOutline),
  Close: () => h(CloseOutline),
  Edit: () => h(CreateOutline),
  Delete: () => h(TrashOutline),
  Refresh: () => h(RefreshOutline)
};

// 导入 Vue 的 h 函数
import { h } from 'vue';