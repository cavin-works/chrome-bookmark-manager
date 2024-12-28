# Chrome 书签管理器

一个美观、实用的 Chrome 书签管理扩展，帮助你更好地组织和管理浏览器书签。

## 功能特点

- 📚 分组显示：按文件夹分组展示书签
- 🔍 实时搜索：快速查找书签
- 📁 文件夹管理：创建、编辑、删除文件夹
- ✨ 拖拽排序：支持书签和文件夹的拖拽排序
- 🌓 暗黑模式：自动适应系统主题，也可手动切换
- 🖼️ 高清图标：自动获取网站的高清图标
- 📱 响应式设计：完美适配各种屏幕尺寸

## 安装使用

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/yourusername/chrome-bookmark-manager.git
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build:all
   ```

4. 在 Chrome 浏览器中加载扩展：
   - 打开 Chrome 浏览器，进入扩展程序页面 (chrome://extensions/)
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 开发说明

- 开发环境：
  ```bash
  npm run dev
  ```

- 构建项目：
  ```bash
  npm run build:all
  ```

## 技术栈

- TypeScript
- Chrome Extension API
- CSS3 (现代布局和动画)
- 原生 JavaScript DOM 操作

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情