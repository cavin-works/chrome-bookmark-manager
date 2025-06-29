// 默认网站图标SVG（内联）
export const DEFAULT_WEBSITE_ICON_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect x="2" y="2" width="28" height="28" rx="6" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1"/>
  <rect x="4" y="4" width="24" height="6" rx="2" fill="#6c757d"/>
  <circle cx="7" cy="7" r="1" fill="#dc3545"/>
  <circle cx="10" cy="7" r="1" fill="#ffc107"/>
  <circle cx="13" cy="7" r="1" fill="#28a745"/>
  <rect x="16" y="5.5" width="10" height="3" rx="1.5" fill="#ffffff" stroke="#dee2e6" stroke-width="0.5"/>
  <rect x="6" y="12" width="20" height="2" rx="1" fill="#adb5bd"/>
  <rect x="6" y="16" width="16" height="2" rx="1" fill="#adb5bd"/>
  <rect x="6" y="20" width="18" height="2" rx="1" fill="#adb5bd"/>
  <rect x="6" y="24" width="12" height="2" rx="1" fill="#adb5bd"/>
  <circle cx="23" cy="19" r="3" fill="#007bff" fill-opacity="0.1" stroke="#007bff" stroke-width="1"/>
  <path d="M21.5 19L22.5 20L24.5 18" stroke="#007bff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`)}`;

// 获取默认图标的函数
export const getDefaultIcon = (): string => {
  return DEFAULT_WEBSITE_ICON_SVG;
};