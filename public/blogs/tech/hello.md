---
title: 你好，Markdown
tags: JavaScript, 工具
date: 2025-07-17
desc: 用一篇示例文章展示本站支持的 Markdown 写法。
---

本站的文章都写在 Markdown 里。把 `.md` 文件放进 `public/blogs/<分类>/`，构建时会自动生成页面，不需要手写 HTML。

下面用几个常见元素，展示一下渲染效果。

## 功能一览

| 特性 | 支持情况 |
|------|----------|
| 标题（H1 ~ H6） | 支持 |
| 加粗、斜体、~~删除线~~ | 支持 |
| 有序 / 无序列表 | 支持 |
| 代码块 + 语法高亮 | 支持 |
| 表格 | 支持 |
| 引用块 | 支持 |
| 图片、链接 | 支持 |
| 暗色模式 | 支持 |

## 代码示例

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
}
```

> 能用 Markdown 写的内容，就不用再手写 HTML。

## 文件放在哪

- 文章：`public/blogs/<分类>/<文件名>.md`
- 关于页：`public/about/`
- 首页与模板：`public/index.html`、`model/`

保存后开发模式会自动重建；生产构建执行 `npm run build`。
