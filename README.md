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
- 📚 自动同步chrome书签：自动同步chrome书签，无需手动导入

## 效果展示

### 主界面
![主界面-浅色模式](/images/main-light.png)
*浅色模式下的主界面，展示分组书签和文件夹*

![主界面-深色模式](/images/main-dark.png)
*深色模式下的主界面*

### 功能演示
![书签搜索](/images/search.png)
*实时搜索功能*

## 安装使用

### 方式一：直接下载安装（推荐）

1. 访问 [Releases](https://github.com/cavin-works/chrome-bookmark-manager/releases) 页面
2. 下载最新版本的 `chrome-bookmark-manager.zip`
3. 解压下载的文件
4. 在 Chrome 浏览器中：
   - 打开扩展程序页面 (chrome://extensions/)
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择刚才解压的文件夹

### 方式二：从源码安装

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/cavin-works/chrome-bookmark-manager.git
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
   - 打开扩展程序页面 (chrome://extensions/)
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 版本更新

### 自动更新
- 访问 [Releases](https://github.com/cavin-works/chrome-bookmark-manager/releases) 页面
- 下载最新版本
- 按照安装步骤重新安装即可

### 手动构建
如果你想自己构建最新版本：

1. 拉取最新代码：
   ```bash
   git pull origin main
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build:all
   ```

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