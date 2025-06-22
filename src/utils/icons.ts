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
  TagOutline,
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
  StarFilled,
  Heart,
  HeartFilled,
  Download,
  Upload,
  Filter,
  Sort,
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
  tag: TagOutline,

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
  starFilled: StarFilled,
  heart: Heart,
  heartFilled: HeartFilled,
  download: Download,
  upload: Upload,
  filter: Filter,
  sort: Sort,
  menu: Menu,
  dots: Dots,
  dotsVertical: DotsVertical,
  externalLink: ExternalLink
} as Record<string, Component>;

// 图标渲染辅助函数
export function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 快捷图标组件
export const IconComponents = {
  Search: () => h(NIcon, null, { default: () => h(SearchOutline) }),
  Bookmark: () => h(NIcon, null, { default: () => h(BookmarkOutline) }),
  Bookmarks: () => h(NIcon, null, { default: () => h(BookmarksOutline) }),
  Folder: () => h(NIcon, null, { default: () => h(FolderOutline) }),
  FolderOpen: () => h(NIcon, null, { default: () => h(FolderOpenOutline) }),
  Add: () => h(NIcon, null, { default: () => h(AddOutline) }),
  Settings: () => h(NIcon, null, { default: () => h(SettingsOutline) }),
  Sun: () => h(NIcon, null, { default: () => h(SunnyOutline) }),
  Moon: () => h(NIcon, null, { default: () => h(MoonOutline) }),
  Grid: () => h(NIcon, null, { default: () => h(GridOutline) }),
  List: () => h(NIcon, null, { default: () => h(ListOutline) }),
  Close: () => h(NIcon, null, { default: () => h(CloseOutline) }),
  Edit: () => h(NIcon, null, { default: () => h(CreateOutline) }),
  Delete: () => h(NIcon, null, { default: () => h(TrashOutline) }),
  Refresh: () => h(NIcon, null, { default: () => h(RefreshOutline) })
};

// 需要导入 h 和 NIcon
import { h } from 'vue';
import { NIcon } from 'naive-ui';