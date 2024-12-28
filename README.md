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

### 方式一：从 Chrome 应用市场安装（推荐）

1. 访问 [Chrome 应用市场](https://chrome.google.com/webstore/detail/chrome-bookmark-manager/your-extension-id)
2. 点击"添加到 Chrome"按钮
3. 在弹出的确认框中点击"添加扩展"

### 方式二：开发者模式安装

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
   - 打开 Chrome 浏览器，进入扩展程序页面 (chrome://extensions/)
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 发布说明

### Chrome 应用市场发布流程

1. 准备发布材料：
   - 扩展图标（16x16, 48x48, 128x128）
   - 至少一张扩展截图（1280x800 或 640x400）
   - 详细的扩展描述（中英文）
   - 隐私政策说明

2. 注册 Chrome 开发者账号：
   - 访问 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole)
   - 支付一次性注册费（$5 USD）
   - 完善开发者信息

3. 打包扩展：
   ```bash
   npm run build:all
   cd dist
   zip -r ../chrome-bookmark-manager.zip *
   ```

4. 提交审核：
   - 登录 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole)
   - 点击"新建项目"
   - 上传打包好的 zip 文件
   - 填写商品详情（标题、描述、图标、截图等）
   - 支付发布费用（$5 USD）
   - 提交审核

5. 审核通过后：
   - 扩展将在 Chrome 应用市场上线
   - 获取唯一的扩展 ID
   - 可以通过应用市场链接分享安装

### 版本更新流程

1. 更新版本号：
   - 修改 `manifest.json` 中的 `version` 字段
   - 遵循语义化版本规范（Semantic Versioning）

2. 构建新版本：
   ```bash
   npm run build:all
   cd dist
   zip -r ../chrome-bookmark-manager-vX.X.X.zip *
   ```

3. 提交更新：
   - 在开发者控制台上传新版本
   - 填写更新说明
   - 等待审核通过

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