/**
 * 标签展示生成脚本
 * 扫描所有博客统计标签，按使用频率分配 h1-h6 标题等级，
 * 生成标签列表页和各标签的独立博客列表页。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(text) {
  if (text.codePointAt(0) === 0xfeff) text = text.slice(1);
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return { meta: {} };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta };
}

function getBasicTemplate() {
  return readFileSync(join('model', 'basic model.html'), 'utf-8');
}

function getTagCategoryTemplate() {
  return readFileSync(join('model', 'tag category model.html'), 'utf-8');
}

/** 按使用次数分配 HTML 标题等级 */
function assignHeadingLevel(rank) {
  if (rank === 1) return 'h1';
  if (rank <= 3) return 'h2';
  if (rank <= 7) return 'h3';
  if (rank <= 15) return 'h4';
  if (rank <= 30) return 'h5';
  return 'h6';
}

/**
 * 扫描博客，返回 { tags: Map, posts: [...] }
 */
function scanBlogs(sourceDir) {
  const blogDir = join(sourceDir, 'blogs');
  const tags = new Map(); // tag → { count, posts: [{title, date, href}] }
  const posts = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const text = readFileSync(full, 'utf-8');
        const { meta } = parseFrontmatter(text);
        const title = meta.title || entry.name.replace(/\.md$/, '');
        const date = meta.date || '';
        const tagList = meta.tags
          ? meta.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        const relPath = join(
          'blogs',
          full.replace(sourceDir + '\\blogs\\', '').replace(/\.md$/, '.html'),
        ).replace(/\\/g, '/');
        const postInfo = { title, date, href: `/${relPath}` };
        posts.push(postInfo);

        for (const tag of tagList) {
          if (!tags.has(tag)) tags.set(tag, { count: 0, posts: [] });
          const tagData = tags.get(tag);
          tagData.count++;
          tagData.posts.push(postInfo);
        }
      }
    }
  }

  walk(blogDir);

  // 每个标签下的博客按时间倒序
  for (const [, tagData] of tags) {
    tagData.posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  return { tags, posts };
}

export function buildTagPages(sourceDir, outDir) {
  const { tags } = scanBlogs(sourceDir);

  // 按使用次数降序排列
  const byCount = [...tags.entries()].sort((a, b) => b[1].count - a[1].count);

  // 分配标题等级（按使用次数排名）
  const headingLevel = new Map();
  for (let i = 0; i < byCount.length; i++) {
    headingLevel.set(byCount[i][0], assignHeadingLevel(i + 1));
  }

  // 按首字母排序（用于页面显示）
  const byAlpha = [...tags.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'));

  // 生成标签列表页 HTML
  let tagsContent =
    '    <section class="tags">\n      <h1 class="tags__title">标签</h1>\n      <div class="tags__card">\n';
  let currentRow = '';
  const maxRowCount = 6;
  let rowItems = 0;

  for (const [tag] of byAlpha) {
    const level = headingLevel.get(tag) || 'h6';
    const href = `/tags/${tag}.html`;
    currentRow += `<${level}><a href="${href}">${esc(tag)}</a></${level}> `;
    rowItems++;
    if (rowItems >= maxRowCount) {
      tagsContent += `      <div class="tags__row">\n        ${currentRow.trim()}\n      </div>\n`;
      currentRow = '';
      rowItems = 0;
    }
  }
  if (currentRow) {
    tagsContent += `      <div class="tags__row">\n        ${currentRow.trim()}\n      </div>\n`;
  }
  tagsContent += '      </div>\n    </section>';

  // 写入标签列表页
  const basicTemplate = getBasicTemplate();
  const tagsIndexHtml = basicTemplate
    .replace(/\{\{TITLE\}\}/g, '标签')
    .replace(/\{\{KEYWORDS\}\}/g, '')
    .replace(/\{\{CONTENT\}\}/g, tagsContent);

  const outTagsDir = join(outDir, 'tags');
  mkdirSync(outTagsDir, { recursive: true });
  writeFileSync(join(outTagsDir, 'index.html'), tagsIndexHtml, 'utf-8');

  // 为每个标签生成独立页面
  const tagCatTemplate = getTagCategoryTemplate();
  for (const [tag, tagData] of tags) {
    const postsHtml = tagData.posts
      .map((p) => `<li><a href="${p.href}">${esc(p.title)}</a></li>`)
      .join('\n            ');

    const tagPageHtml = tagCatTemplate
      .replace(/\{\{TITLE\}\}/g, esc(tag))
      .replace(/\{\{CONTENT\}\}/g, postsHtml);

    writeFileSync(join(outTagsDir, `${tag}.html`), tagPageHtml, 'utf-8');
  }

  console.log(`  Tag pages: ${tags.size} tags`);
}
