/**
 * About 页面构建脚本
 * 将 public/about/ 下的 about_site.md 和 about_me.md 转为 HTML，
 * 以 basic_model.html 为模板，输出到 dist/about/
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { marked } from 'marked';

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
  if (!m) return { content: text, meta: {} };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { content: text.slice(m[0].length), meta };
}

/** 关于页使用纯色背景：移除模板中的线框地球容器 */
function getAboutTemplate() {
  return readFileSync(join('model', 'basic_model.html'), 'utf-8').replace(
    /\s*<!-- 线框地球[^>]*-->\s*<div class="bg-globe"[^>]*><\/div>/,
    '',
  );
}

export function buildAbout(sourceDir, outDir) {
  const aboutDir = join(sourceDir, 'about');
  const template = getAboutTemplate();
  const files = ['about_site.md', 'about_me.md'];

  for (const file of files) {
    const mdPath = join(aboutDir, file);
    const mdText = readFileSync(mdPath, 'utf-8');
    const { content, meta } = parseFrontmatter(mdText);
    const bodyHtml = marked.parse(content, { gfm: true });
    const title = meta.title || basename(mdPath, '.md');
    const keywords = meta.tags ? `<meta name="keywords" content="${esc(meta.tags)}" />` : '';
    const outFile = join(outDir, 'about', `${basename(mdPath, '.md')}.html`);

    const pageHtml = template
      .replace(/\{\{TITLE\}\}/g, esc(title))
      .replace(/\{\{KEYWORDS\}\}/g, keywords)
      .replace(/\{\{CONTENT\}\}/g, bodyHtml);

    mkdirSync(join(outFile, '..'), { recursive: true });
    writeFileSync(outFile, pageHtml, 'utf-8');
  }

  console.log('  About pages built');
}
