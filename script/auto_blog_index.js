/**
 * 博客分类索引生成脚本
 * 扫描 public/blogs/ 目录结构，生成展开/折叠式分类树。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBasicTemplate() {
  return readFileSync(join('model', 'basic_model.html'), 'utf-8');
}

/**
 * 递归生成目录树 HTML（使用 details/summary 实现折叠）
 * @param {string} dir 当前扫描的目录
 * @param {string} baseDir blogs/ 基目录
 * @param {number} depth 缩进深度
 */
function buildTree(dir, baseDir, depth) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const files = entries.filter(
    (e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md',
  );

  // 按首字母排序目录
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  // 按文件名排序博客
  files.sort((a, b) => a.name.localeCompare(b.name));

  let html = '';

  // 目录（折叠）
  for (const d of dirs) {
    const subDir = join(dir, d.name);
    const children = buildTree(subDir, baseDir, depth + 1);
    html += `<li class="category__item">
  <details${depth === 0 ? '' : ''} class="category__details">
    <summary class="category__toggle">${esc(d.name)}</summary>
    <ul class="category__children">
${children}    </ul>
  </details>
</li>\n`;
  }

  // 文件（博客链接）
  for (const f of files) {
    const relPath = relative(baseDir, join(dir, f.name)).replace(/\\/g, '/');
    const href = `/blogs/${relPath.replace(/\.md$/, '.html')}`;
    const title = f.name.replace(/\.md$/, '');
    html += `<li class="category__item"><a href="${href}">${esc(title)}</a></li>\n`;
  }

  return html;
}

export function buildBlogIndex(sourceDir, outDir) {
  const blogDir = join(sourceDir, 'blogs');
  const treeHtml = buildTree(blogDir, blogDir, 0);

  const content = `
    <section class="category">
      <h1 class="category__title">分类</h1>
      <ul class="category__tree">
${treeHtml}      </ul>
    </section>`;

  const basicTemplate = getBasicTemplate();
  const pageHtml = basicTemplate
    .replace(/\{\{TITLE\}\}/g, '分类')
    .replace(/\{\{KEYWORDS\}\}/g, '')
    .replace(/\{\{CONTENT\}\}/g, content);

  const outBlogsDir = join(outDir, 'blogs');
  mkdirSync(outBlogsDir, { recursive: true });
  writeFileSync(join(outBlogsDir, 'index.html'), pageHtml, 'utf-8');

  console.log('  Blog index built');
}
