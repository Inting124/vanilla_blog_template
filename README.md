# 个人博客站模板

一个零框架的静态个人博客模板：用 Markdown 写文章，构建时自动生成首页、文章列表、分页、分类树、标签页和关于页。样式与交互由原生 CSS 和少量 TypeScript 完成，不依赖 Webpack、Vite、React 等框架。

适合部署到 GitHub Pages、Nginx 或任意静态托管，也可以作为 GitHub Template 直接开始自己的博客。

由 [Inting124](https://github.com/Inting124) 制作并维护。

## 特性

- Markdown 文章，front matter 驱动标题、日期、摘要和标签
- 按目录自动生成分类树，按标签生成标签页
- 文章列表分页（每页 10 篇，按日期倒序）
- 亮色 / 暗色 / 跟随系统
- 首页 Canvas 线框地球背景、移动端导航
- 文章页自动目录（二级、三级标题）
- esbuild 快速构建、Biome 检查、Node.js 原生测试

## 技术栈

| | |
|--|--|
| 语言 | TypeScript（strict） |
| 构建 | esbuild |
| 代码规范 | Biome |
| Markdown | marked |
| 测试 | `node --test` |

## 环境要求

- Node.js 20+
- npm，`package.json` 已开启 `"type": "module"`
- 运行 `npm run test` 需要支持 `--experimental-strip-types` 的 Node.js（建议 22.6+）

## 使用此模板

1. 在 GitHub 页面点击 **Use this template**，或把仓库克隆到本地
2. 安装依赖并启动开发服务器
3. 按下方的“自定义站点”修改站点信息
4. 构建后部署生成的可部署副本

```bash
npm install
npm run dev
```

开发服务器地址会打印在终端。修改 `public/` 或 `model/` 后会自动重建。

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器并监听文件变化 |
| `npm run build` | 生产构建（压缩，并生成可部署副本） |
| `npm run check` | Biome 检查并格式化 |
| `npm run typecheck` | TypeScript 严格检查 |
| `npm run test` | Node.js 原生测试 |
| `npm run sync` | 把基础模板的页眉页脚同步到其他模板 |

## 写一篇文章

在 `public/blogs/<分类>/` 下新建 `.md`。第一级目录名就是分类，可以继续嵌套子目录。文件名会成为页面地址，例如 `public/blogs/tech/笔记.md` 对应 `/blogs/tech/笔记.html`。不要手写文章 HTML。

```md
---
title: 文章标题
tags: 教程, 工具
date: 2025-07-18
desc: 一句话摘要，显示在列表卡片上。
---

## 第一节

正文从二级标题写起。页面大标题来自 title。
```

| 字段 | 作用 |
|------|------|
| title | 页面标题，缺省时用文件名 |
| tags | 英文逗号分隔，用于标签页 |
| date | `YYYY-MM-DD`，列表按它倒序 |
| desc | 列表卡片摘要 |

改完后开发模式会自动重建；生产环境执行 `npm run build`。列表、分类和标签会一起更新。

关于页正文在 `public/about/about_me.md` 与 `public/about/about_site.md`。

## 自定义站点

1. 首页文案、姓名和简介：`public/index.html`
2. 导航站名、页脚：先改 `model/basic_model.html`，再执行 `npm run sync`
3. 配色与间距：`src/css/variables.css`
4. 站点图标：`public/asset_light/crop.svg`
5. `package.json` 里的 `name` 改成仓库名
6. `LICENSE` 里的版权署名改成自己的信息
7. 示例文章：替换或删除 `public/blogs/` 下不需要的内容

## 图片与视频

文章中使用以 `/assets/image/`、`/assets/video/` 开头的站点绝对路径引用媒体文件。生产构建会把这些前缀改写为图床地址，图床域名在 `script/auto_path_to_url.js` 的 `IMAGE_HOST`，发布前请改成自己的地址。

媒体文件本身不纳入版本控制。

## 构建与部署

`npm run build` 会压缩资源，生成可部署副本到 `deploy/`，并把媒体路径改写为 `IMAGE_HOST` 指向的图床地址。把 `deploy/` 作为站点根目录上传即可。

构建顺序：同步模板 → 关于页 → Markdown 转 HTML → 文章列表 → 分类索引 → 标签页 →（仅生产构建）替换媒体地址并生成可部署副本。

> 模板使用以 `/` 开头的站点根路径。如果部署在 GitHub Pages 的 `用户名.github.io/仓库名/` 子路径下，需要改用自定义域名，或把站内链接改为相对路径。

## 目录结构

```text
├── public/                 站点源文件
│   ├── index.html          首页
│   ├── about/              关于页
│   ├── blogs/              按分类存放的文章 Markdown
│   └── asset_light/        站点图标
├── model/                  页面模板（页眉页脚、文章、列表、标签）
├── src/                    样式与脚本（入口 src/index.ts）
├── script/                 Markdown、列表、分类、标签与部署脚本
├── tests/                  Node.js 原生测试
├── esbuild.config.js       构建与开发服务器
├── biome.json              Biome 配置
├── tsconfig.json           TypeScript 配置
├── package.json
├── LICENSE
└── README.md
```

## 许可

[MIT License](LICENSE)。Copyright (c) 2026 Inting124。可以自由使用、修改、商用和再分发，包括闭源；再分发时须保留版权声明和许可全文。
