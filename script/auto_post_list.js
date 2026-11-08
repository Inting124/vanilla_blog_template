/**
 * 文章列表生成脚本
 * 扫描 public/blogs/ 下所有 .md 文件，提取元数据，生成卡片列表与分页导航。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';

const PAGE_SIZE = 10;

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
  return { meta, after: text.slice(m[0].length) };
}

function getCardTemplate() {
  return readFileSync(join('model', 'list_card_model.html'), 'utf-8');
}

function getBasicTemplate() {
  return readFileSync(join('model', 'basic_model.html'), 'utf-8');
}

/** 从 .md 文件提取文章元数据 */
function extractPost(filePath) {
  const slug = basename(filePath, extname(filePath));
  const text = readFileSync(filePath, 'utf-8');
  const { meta, after } = parseFrontmatter(text);

  const title = meta.title || slug;
  const date = meta.date || '';
  const desc = meta.desc || '';
  const tags = meta.tags
    ? meta.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // 从正文提取摘要（取第一段非标题文本）
  let excerpt = desc;
  if (!excerpt) {
    const firstPara = after.match(/\n\n(.+?)(?:\n\n|\n#|\n```|$)/s);
    if (firstPara) excerpt = firstPara[1].trim().replace(/\n/g, ' ').substring(0, 200);
  }

  // 分类名 = md 文件相对于 public/blogs/ 的目录路径
  const relDir = relative(join('public', 'blogs'), dirname(filePath));
  const category = relDir || '';

  // 链接路径
  const href = `/blogs/${relDir ? relDir.replace(/\\/g, '/') + '/' : ''}${slug}.html`;

  return { slug, href, title, date, desc, tags, excerpt, category };
}

/** 渲染单张文章卡片 */
function renderCard(post) {
  const template = getCardTemplate();
  const tagsHtml =
    post.tags.length > 0
      ? post.tags
          .map((t) => `<a href="/tags/${t}.html" class="card-tag">${esc(t)}</a>`)
          .join('\n      ')
      : '';
  const thumbnailHtml = ''; // 暂不生成缩略图

  return template
    .replace(/\{\{TITLE\}\}/g, esc(post.title))
    .replace(/\{\{LINK\}\}/g, post.href)
    .replace(/\{\{DATE\}\}/g, post.date)
    .replace(/\{\{DATE_DISPLAY\}\}/g, post.date)
    .replace(/\{\{CATEGORY\}\}/g, esc(post.category))
    .replace(/\{\{EXCERPT\}\}/g, esc(post.excerpt))
    .replace(/\{\{TAGS\}\}/g, tagsHtml)
    .replace(/\{\{THUMBNAIL\}\}/g, thumbnailHtml);
}

/** 生成分页导航 HTML */
function renderPagination(currentPage, totalPages, basePath) {
  if (totalPages <= 1) return '';

  let html = '<nav class="pagination">\n';

  // 上一页
  const prevLink =
    currentPage === 1
      ? `<span class="pagination__btn pagination__btn--disabled">&laquo; 上一页</span>`
      : `<a class="pagination__btn" href="${basePath}${currentPage === 2 ? '/index.html' : `/page-${currentPage - 1}.html`}">&laquo; 上一页</a>`;
  html += `  ${prevLink}\n`;

  // 页码
  for (let p = 1; p <= totalPages; p++) {
    if (p === currentPage) {
      html += `  <span class="pagination__btn pagination__btn--current">${p}</span>\n`;
    } else {
      const link = p === 1 ? '/index.html' : `/page-${p}.html`;
      html += `  <a class="pagination__btn" href="${basePath}${link}">${p}</a>\n`;
    }
  }

  // 下一页
  const nextLink =
    currentPage === totalPages
      ? `<span class="pagination__btn pagination__btn--disabled">下一页 &raquo;</span>`
      : `<a class="pagination__btn" href="${basePath}/page-${currentPage + 1}.html">下一页 &raquo;</a>`;
  html += `  ${nextLink}\n`;

  html += '</nav>';
  return html;
}

export function buildPostList(sourceDir, outDir) {
  const blogDir = join(sourceDir, 'blogs');
  const posts = [];

  // 递归扫描 .md
  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        posts.push(extractPost(full));
      }
    }
  }

  walk(blogDir);

  // 按日期倒序
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalPages = Math.ceil(posts.length / PAGE_SIZE) || 1;
  const basicTemplate = getBasicTemplate();

  // 为每一页生成 HTML
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * PAGE_SIZE;
    const pagePosts = posts.slice(start, start + PAGE_SIZE);

    const cardsHtml = pagePosts.map(renderCard).join('\n');
    const paginationHtml = renderPagination(page, totalPages, '/posts');

    const content = `
    <section class="section">
      <div class="post-list">
        <h1 class="section-title">文章</h1>

${cardsHtml}
      </div>
${paginationHtml}
    </section>`;

    const pageHtml = basicTemplate
      .replace(/\{\{TITLE\}\}/g, '文章')
      .replace(/\{\{KEYWORDS\}\}/g, '')
      .replace(/\{\{CONTENT\}\}/g, content);

    const outDirPosts = join(outDir, 'posts');
    mkdirSync(outDirPosts, { recursive: true });

    const filename = page === 1 ? 'index.html' : `page-${page}.html`;
    writeFileSync(join(outDirPosts, filename), pageHtml, 'utf-8');
  }

  console.log(`  Post list: ${posts.length} posts, ${totalPages} pages`);
  return posts;
}
