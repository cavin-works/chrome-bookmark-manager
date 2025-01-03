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
- 📚 自动同步：自动同步 Chrome 书签，无需手动导入
- 🚀 自动发布：使用 GitHub Actions 自动构建和发布新版本

## 更新记录

### v1.1.2 (2024-01-03)
- 🔧 修复：修复文件夹拖动排序的 TypeScript 类型错误
- 🔄 优化：改进 CRX 打包流程，使用 chrome-extension-cli
- 📝 文档：完善安装说明和使用文档

### v1.1.1 (2024-01-03)
- ✨ 新增：支持文件夹拖动排序功能
- 🎨 优化：改进拖拽时的视觉反馈效果
- 🐛 修复：修复书签拖入文件夹的问题

### v1.1.0 (2024-01-03)
- 🎉 新增：支持 CRX 格式安装包
- 🔄 优化：改进发布流程，自动生成更新日志
- 📦 优化：优化构建流程，添加版本号到发布文件

### v1.0.0 (2024-01-02)
- 🎉 首次发布
- 📚 基础功能：书签管理、文件夹管理
- 🔍 搜索功能：支持实时搜索
- 🌓 主题切换：支持亮色/暗色模式
- 🖼️ 图标优化：支持高清网站图标
- 📱 响应式：支持各种屏幕尺寸

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

### 方式一：CRX 文件安装（最简单）

1. 访问 [Releases](https://github.com/cavin-works/chrome-bookmark-manager/releases) 页面
2. 下载最新版本的 `chrome-bookmark-manager-vx.x.x.crx` 文件
3. 打开 Chrome 浏览器，将下载的 CRX 文件拖入浏览器窗口
4. 点击"添加扩展程序"按钮完成安装

### 方式二：ZIP 文件安装（开发者模式）

1. 访问 [Releases](https://github.com/cavin-works/chrome-bookmark-manager/releases) 页面
2. 下载最新版本的 `chrome-bookmark-manager-vx.x.x.zip`
3. 解压下载的文件
4. 在 Chrome 浏览器中：
   - 打开扩展程序页面 (chrome://extensions/)
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择刚才解压的文件夹

### 方式三：从源码安装（开发者）

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

## 使用说明

### 基本操作

1. **查看书签**
   - 左侧面板显示所有书签文件夹
   - 右侧面板显示当前文件夹的书签
   - 点击"全部书签"可查看所有书签

2. **搜索书签**
   - 在顶部搜索框输入关键词
   - 支持按标题和网址搜索
   - 搜索结果会按文件夹分组显示

3. **管理书签**
   - 点击书签可直接打开对应网页
   - 拖动书签可更改其所属文件夹
   - 每个书签右侧有编辑和删除按钮

4. **管理文件夹**
   - 点击顶部"新建文件夹"按钮创建文件夹
   - 拖动文件夹可调整顺序
   - 文件夹右侧有编辑和删除按钮

5. **切换主题**
   - 点击顶部月亮图标切换暗黑模式
   - 自动跟随系统主题设置

### 快捷操作

- **拖拽功能**：
  - 拖动书签到文件夹：移动书签
  - 拖动文件夹：调整文件夹顺序
  - 拖动时会显示视觉提示

- **文件夹操作**：
  - 单击：显示文件夹内容
  - 右侧按钮：编辑或删除
  - 拖拽排序：调整显示顺序

## 版本发布

本项目使用 GitHub Actions 自动构建和发布新版本。

### 发布新版本

1. 更新版本号：
   ```bash
   # 修改 manifest.json 中的 version 字段
   git add manifest.json
   git commit -m "chore: bump version to x.x.x"
   ```

2. 创建新标签：
   ```bash
   git tag -a vx.x.x -m "Release version x.x.x"
   git push origin vx.x.x
   ```

3. 自动发布流程：
   - GitHub Actions 自动触发构建
   - 生成 ZIP 和 CRX 文件
   - 创建 Release 并上传文件
   - 自动生成更新日志

### 更新扩展

1. **CRX 安装用户**
   - Chrome 会自动检查和更新扩展

2. **ZIP/源码安装用户**
   - 访问 [Releases](https://github.com/cavin-works/chrome-bookmark-manager/releases)
   - 下载最新版本
   - 按照安装步骤重新安装

## 开发指南

### 开发环境设置

1. 安装依赖：
   ```bash
   npm install
   ```

2. 开发模式：
   ```bash
   npm run dev
   ```

3. 构建项目：
   ```bash
   npm run build:all
   ```

### 项目结构

```
├── src/                # 源代码目录
│   ├── js/            # TypeScript 源文件
│   ├── styles/        # CSS 样式文件
│   └── types/         # TypeScript 类型定义
├── dist/              # 构建输出目录
├── images/            # 项目图片资源
└── icons/            # 扩展图标
```

### 技术栈

- TypeScript：类型安全的 JavaScript 超集
- Chrome Extension API：浏览器扩展开发
- CSS3：现代布局和动画效果
- GitHub Actions：自动化构建和发布

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交改动：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

### 提交规范

- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 问题反馈

如果你发现任何问题或有改进建议，欢迎：

1. 提交 [Issue](https://github.com/cavin-works/chrome-bookmark-manager/issues)
2. 提交 Pull Request
3. 联系开发者