/**
 * Markdown → HTML 构建脚本
 * 扫描 public/blogs/ 下所有 .md 文件，以 blog_model.html 为模板生成完整 HTML 页面。
 * 输出到 dist/blogs/{category_path}/{slug}.html
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { marked } from 'marked';

/** 缓存模板内容 */
let _blogTemplate = null;
function getBlogTemplate() {
  if (!_blogTemplate) {
    _blogTemplate = readFileSync(join('model', 'blog_model.html'), 'utf-8');
  }
  return _blogTemplate;
}

/** 解析 frontmatter */
function parseFrontmatter(text) {
  if (text.codePointAt(0) === 0xfeff) text = text.slice(1);
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return { content: text, meta: {} };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { content: text.slice(m[0].length), meta };
}

/** HTML 转义 */
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 从 Markdown HTML 中提取标题并生成 TOC */
function generateTOC(bodyHtml) {
  const headings = [...bodyHtml.matchAll(/<h([23])[^>]*id="([^"]*)"[^>]*>([^<]+)<\/h[23]>/g)];
  if (headings.length === 0) return '';

  let toc = '<ul class="toc-nav__list">\n';
  for (const [, level, id, text] of headings) {
    const indent = level === '3' ? ' toc-nav__item--h3' : '';
    toc += `  <li class="toc-nav__item${indent}"><a href="#${id}">${text}</a></li>\n`;
  }
  toc += '</ul>';
  return toc;
}

/** 给 Markdown 生成的标题添加 id，以便 TOC 锚点定位 */
function addHeadingIds(bodyHtml) {
  const counter = {};
  return bodyHtml.replace(/<(h[23])>([^<]+)<\/\1>/g, (_, tag, text) => {
    const stripped = text.replace(/<[^>]+>/g, '').trim();
    const baseId = stripped.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
    const id = baseId || 'heading';
    counter[id] = (counter[id] || 0) + 1;
    const uniqueId = counter[id] > 1 ? `${id}-${counter[id]}` : id;
    return `<${tag} id="${uniqueId}">${text}</${tag}>`;
  });
}

/** 转换单个 .md 文件 */
export function convertMdFile(mdPath, outDir) {
  const mdText = readFileSync(mdPath, 'utf-8');
  const { content, meta } = parseFrontmatter(mdText);
  let bodyHtml = marked.parse(content, { gfm: true });
  bodyHtml = addHeadingIds(bodyHtml);

  const title = meta.title || basename(mdPath, '.md');
  const keywords = meta.tags ? `<meta name="keywords" content="${esc(meta.tags)}" />` : '';
  const date = meta.date || '';
  const dateDisplay = date || '';

  // 生成标签链接 HTML
  const tags = meta.tags
    ? meta.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const tagsHtml =
    tags.length > 0
      ? tags
          .map((t) => `<a href="/tags/${t}.html" class="card-tag">${esc(t)}</a>`)
          .join('\n            ')
      : '';

  // 生成 TOC
  const toc = generateTOC(bodyHtml);

  const relDir = relative('public/blogs', dirname(mdPath));
  const outFile = join(outDir, 'blogs', relDir, `${basename(mdPath, '.md')}.html`);

  const pageHtml = getBlogTemplate()
    .replace(/\{\{TITLE\}\}/g, esc(title))
    .replace(/\{\{KEYWORDS\}\}/g, keywords)
    .replace(/\{\{CONTENT\}\}/g, bodyHtml)
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{DATE_DISPLAY\}\}/g, dateDisplay)
    .replace(/\{\{TAGS\}\}/g, tagsHtml)
    .replace(/\{\{TOC\}\}/g, toc);

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, pageHtml, 'utf-8');
  return outFile;
}

/** 递归遍历 public/blogs/ 下所有 .md 文件并转为 .html */
export function convertAllMd(sourceDir, outDir) {
  const blogDir = join(sourceDir, 'blogs');
  const results = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const html = convertMdFile(full, outDir);
        results.push({ md: full, html });
      }
    }
  }

  walk(blogDir);
  return results;
}
