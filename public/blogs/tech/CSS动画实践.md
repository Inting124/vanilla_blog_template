---
title: CSS 动画实践
tags: CSS, 教程
date: 2025-07-05
desc: 探索用纯 CSS 实现流畅交互效果的技巧。
---

## 为什么优先用 CSS 做交互？

主要有三个原因：

1. **性能更好**：CSS 动画由浏览器引擎直接优化，运行在合成器线程上，不阻塞主线程。
2. **代码更少**：一个 `transition: transform 0.3s` 就能替代几行 JS 的 `addEventListener` + 定时器。
3. **优雅降级**：即使浏览器不支持某些 CSS 特性，也只是看不到动画，内容本身不受影响。

## 常用技巧

### 1. 悬停浮起效果

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 2. 链接下划线动画

```css
.nav-links a::after {
  content: '';
  display: block;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s ease;
}
.nav-links a:hover::after,
.nav-links a.active::after {
  width: 100%;
}
```

### 3. 暗色模式自适应

不用 JS，在 CSS 里用自定义属性（变量）配合 `@media (prefers-color-scheme: dark)` 就能切换暗色模式：

```css
:root { --bg: #fff; --text: #333; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #1a1a2e; --text: #e0e0e0; }
}
body { background: var(--bg); color: var(--text); }
```

### 4. 页面加载淡入

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero { animation: fadeIn 0.6s ease; }
```

## 总结

能用 CSS 解决的问题，就别写 JavaScript。
这样既能减少代码体积，也能让网站更快、更好维护。
