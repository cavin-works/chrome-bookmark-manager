import {
  // 基础组件
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,

  // 布局组件
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutSider,
  NSpace,
  NDivider,

  // 导航组件
  NMenu,
  NBreadcrumb,
  NBreadcrumbItem,
  NTree,

  // 数据录入组件
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NButton,
  NButtonGroup,
  NSelect,
  NCheckbox,
  NSwitch,
  NSlider,
  NForm,
  NFormItem,

  // 数据展示组件
  NCard,
  NList,
  NListItem,
  NThing,
  NDescriptions,
  NDescriptionsItem,
  NTable,
  NDataTable,
  NTag,
  NProgress,
  NAvatar,
  NImage,
  NCarousel,
  NText,

  // 反馈组件
  NAlert,
  NModal,
  NDrawer,
  NDrawerContent,
  NPagination,
  NSpin,
  NSkeleton,
  NEmpty,
  NResult,

  // 其他组件
  NIcon,
  NTooltip,
  NPopover,
  NDropdown,
  NScrollbar,
  NAffix,
  NBackTop,
  NEllipsis,

  // 主题
  darkTheme,
  lightTheme,

  // 全局配置
  createDiscreteApi
} from 'naive-ui';

// 导出所有需要的组件
export {
  // 基础组件
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,

  // 布局组件
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutSider,
  NSpace,
  NDivider,

  // 导航组件
  NMenu,
  NBreadcrumb,
  NBreadcrumbItem,
  NTree,

  // 数据录入组件
  NInput,
  NInputGroup,
  NInputGroupLabel,
  NButton,
  NButtonGroup,
  NSelect,
  NCheckbox,
  NSwitch,
  NSlider,
  NForm,
  NFormItem,

  // 数据展示组件
  NCard,
  NList,
  NListItem,
  NThing,
  NDescriptions,
  NDescriptionsItem,
  NTable,
  NDataTable,
  NTag,
  NProgress,
  NAvatar,
  NImage,
  NCarousel,
  NText,

  // 反馈组件
  NAlert,
  NModal,
  NDrawer,
  NDrawerContent,
  NPagination,
  NSpin,
  NSkeleton,
  NEmpty,
  NResult,

  // 其他组件
  NIcon,
  NTooltip,
  NPopover,
  NDropdown,
  NScrollbar,
  NAffix,
  NBackTop,
  NEllipsis,

  // 主题
  darkTheme,
  lightTheme
};

// 创建离散式 API
export const { message, dialog, notification, loadingBar } = createDiscreteApi([
  'message',
  'dialog',
  'notification',
  'loadingBar'
]);

// 主题配置
export const themeConfig = {
  light: lightTheme,
  dark: darkTheme,
};

// 通用配置
export const commonConfig = {
  dateLocale: 'zhCN',
  locale: 'zhCN'
};