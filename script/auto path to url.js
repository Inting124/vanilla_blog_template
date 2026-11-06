/**
 * 部署脚本
 * 复制 dist/ → deploy/，将本地媒体路径替换为图床 URL。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const IMAGE_HOST = 'https://www.imagehosting.com';
const SRC = 'dist';
const DST = 'deploy';

function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      writeFileSync(d, readFileSync(s));
    }
  }
}

function replaceAssetPaths(html) {
  return html
    .replace(/src="\/assets\/image\//g, `src="${IMAGE_HOST}/assets/image/`)
    .replace(/src="\/assets\/video\//g, `src="${IMAGE_HOST}/assets/video/`)
    .replace(/srcset="\/assets\/image\//g, `srcset="${IMAGE_HOST}/assets/image/`)
    .replace(/href="\/assets\/image\//g, `href="${IMAGE_HOST}/assets/image/`)
    .replace(/href="\/assets\/video\//g, `href="${IMAGE_HOST}/assets/video/`);
}

function processDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.html')) {
      const content = readFileSync(full, 'utf-8');
      const replaced = replaceAssetPaths(content);
      if (content !== replaced) {
        writeFileSync(full, replaced, 'utf-8');
        console.log(`  Replaced: ${relative(DST, full)}`);
      }
    }
  }
}

export function deploy() {
  if (!existsSync(SRC)) {
    console.error('ERROR: dist/ not found. Build first.');
    process.exit(1);
  }

  console.log(`Deploy: ${SRC}/ -> ${DST}/`);

  if (existsSync(DST)) {
    rmSync(DST, { recursive: true, force: true });
  }
  copyDirSync(SRC, DST);
  console.log('  Copied dist/ -> deploy/');

  processDir(DST);
  console.log(`  Asset paths replaced with ${IMAGE_HOST}`);
  console.log(`Done -> ${DST}/`);
}
