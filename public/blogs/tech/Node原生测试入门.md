---
title: Node 原生测试入门
tags: JavaScript, 教程
date: 2025-06-12
desc: 不装测试框架，用 node --test 写最小可运行的用例。
---

## 为什么用内置测试

Node.js 20 起自带测试运行器。小型项目不必再引入 Jest 或 Vitest，少一个依赖，脚本也更简单。

如果测试文件是 TypeScript，需要 Node.js 22.6+ 的类型剥离支持；本仓库直接执行 `npm run test`。

## 最小用例

测试文件放在 `tests/`，以 `.test.ts` 结尾：

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('文章标题', () => {
  it('缺省时回退到文件名', () => {
    const file = '博客写作格式.md';
    const title = file.slice(0, -3);
    assert.equal(title, '博客写作格式');
  });
});
```

运行：

```bash
npm run test
```

## 失败时看什么

断言失败会打印期望值和实际值。先检查输入是否正确、边界情况有没有覆盖，不要一上来就加日志，把用例写乱。

## 和本仓库的关系

类型检查走 `tsc`，风格走 Biome，行为走 `node --test`。三件事各管一摊，每件都保持简单。
