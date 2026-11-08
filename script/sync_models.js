/**
 * 手动模板同步脚本
 * 将 basic_model.html 的页首（header）和页脚（footer）同步到另外两个模板。
 *
 * 使用方式：npm run sync
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MODEL_DIR = 'model';
const BASIC = 'basic_model.html';
const TARGETS = ['blog_model.html', 'tag_category_model.html'];

const basicHtml = readFileSync(join(MODEL_DIR, BASIC), 'utf-8');

const headerMatch = basicHtml.match(/<header[\s\S]*?<\/header>/);
const footerMatch = basicHtml.match(/<footer[\s\S]*?<\/footer>/);
if (!headerMatch || !footerMatch) {
  console.error('Error: header/footer not found in basic_model.html');
  process.exit(1);
}

const headerContent = headerMatch[0];
const footerContent = footerMatch[0];

for (const target of TARGETS) {
  const filePath = join(MODEL_DIR, target);
  let html = readFileSync(filePath, 'utf-8');
  html = html.replace(/<header[\s\S]*?<\/header>/, headerContent);
  html = html.replace(/<footer[\s\S]*?<\/footer>/, footerContent);
  writeFileSync(filePath, html, 'utf-8');
  console.log(`  Synced -> model/${target}`);
}

console.log('Sync done.');
