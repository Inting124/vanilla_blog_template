/**
 * 模板同步脚本
 * 将 basic model.html 的页首（header）和页脚（footer）同步到其他模板和 index.html
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function syncFile(filePath, headerContent, footerContent) {
  let html = readFileSync(filePath, 'utf-8');
  // 替换页首：从 <header 到 </header>
  html = html.replace(/<header[\s\S]*?<\/header>/, headerContent);
  // 替换页脚：从 <footer 到 </footer>
  html = html.replace(/<footer[\s\S]*?<\/footer>/, footerContent);
  writeFileSync(filePath, html, 'utf-8');
}

export function syncModels() {
  const basicPath = join('model', 'basic model.html');
  const basicHtml = readFileSync(basicPath, 'utf-8');

  // 提取 header 和 footer
  const headerMatch = basicHtml.match(/<header[\s\S]*?<\/header>/);
  const footerMatch = basicHtml.match(/<footer[\s\S]*?<\/footer>/);
  if (!headerMatch || !footerMatch) {
    console.error('  Model sync failed: header/footer not found in basic model.html');
    return;
  }

  const headerContent = headerMatch[0];
  const footerContent = footerMatch[0];

  // 同步模型文件
  // Model source files are synced during build only; dist/ files get synced below

  // 同步所有 public/ 下的 index.html
  const publicDir = 'dist';
  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === 'index.html') {
        syncFile(full, headerContent, footerContent);
      }
    }
  }
  walk(publicDir);

  console.log('  Model sync done');
}
