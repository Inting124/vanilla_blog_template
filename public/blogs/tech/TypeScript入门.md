---
title: TypeScript 入门指南
tags: JavaScript, 教程
date: 2025-06-20
desc: 从 JavaScript 平滑过渡到 TypeScript 的实用指南。
---

## 为什么选择 TypeScript？

TypeScript 是 JavaScript 的超集，增加了静态类型系统。它能在编译阶段发现大量错误，让大型项目更容易维护。

## 基础类型

```ts
let name: string = 'Codex';
let age: number = 25;
let isActive: boolean = true;
let items: string[] = ['a', 'b', 'c'];
```

## 接口与类型别名

```ts
interface User { name: string; age: number; }
type Post = { title: string; date: string; tags: string[]; };
```

## 总结

TypeScript 可以渐进式引入：不必一次性重写现有 JS 项目，可以边写边补类型。
