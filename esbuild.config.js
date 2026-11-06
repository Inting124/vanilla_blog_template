/**
 * esbuild 构建配置
 * - 开发模式 (--watch --serve): 输出到 dist/，提供热更新开发服务器
 * - 监听模式 (--watch): 输出到 dist/，持续监听源代码变动
 * - 生产模式 (--prod): 输出到 dist/ 并压缩
 * 构建流程：model sync → about switch → md to html → post list → blog index → tag show
 *         → path to url（仅 --prod）
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';
import { buildAbout } from './script/auto about switch.js';
import { buildBlogIndex } from './script/auto blog index.js';
import { convertAllMd, convertMdFile } from './script/auto md to html.js';
import { syncModels } from './script/auto model sync.js';
import { deploy } from './script/auto path to url.js';
import { buildPostList } from './script/auto post list.js';
import { buildTagPages } from './script/auto tag show.js';

const isProd = process.argv.includes('--prod');
const isWatch = process.argv.includes('--watch');
const isServe = process.argv.includes('--serve');

const outdir = 'dist';
const publicDir = 'public';

/** 递归复制目录 */
function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (statSync(s).isDirectory()) {
      copyDirSync(s, d);
    } else if (!entry.name.endsWith('.md')) {
      writeFileSync(d, readFileSync(s));
    }
  }
}

/** 清理并重建 dist/，从 public/ 复制静态文件 */
function copyPublic() {
  if (existsSync(outdir)) {
    try {
      rmSync(outdir, { recursive: true, force: true });
    } catch {
      /* skip */
    }
  }
  copyDirSync(publicDir, outdir);
}

/** 完整构建流程 */
function fullBuild(silent = false) {
  if (!silent) console.log('Building...');

  // 步骤 1: 同步模板
  syncModels();

  // 步骤 2: 构建 About 页面
  buildAbout(publicDir, outdir);

  // 步骤 3: MD → HTML（博客）
  const mdResults = convertAllMd(publicDir, outdir);
  if (!silent) {
    for (const r of mdResults) {
      console.log(`  MD -> ${r.html.replace(/\\/g, '/').replace(/.*[/]dist[/]/, '')}`);
    }
  }

  // 步骤 4: 生成文章列表
  buildPostList(publicDir, outdir);

  // 步骤 5: 生成分类索引
  buildBlogIndex(publicDir, outdir);

  // 步骤 6: 生成标签页
  buildTagPages(publicDir, outdir);

  // 步骤 7: 部署
  if (isProd) {
    deploy();
  }
}

/** 监听 public/ 和 model/ 变动 */
function watchPublic() {
  console.log('Watching public/ and model/ for changes...');

  const rebuild = () => {
    try {
      fullBuild(true);
    } catch (e) {
      console.error('Rebuild error:', e.message);
    }
  };

  // 监听 public/
  watch(publicDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const srcPath = join(publicDir, filename);
    const destPath = join(outdir, filename);

    try {
      if (eventType === 'rename' && !existsSync(srcPath)) {
        if (filename.endsWith('.md')) {
          const htmlPath = join(outdir, filename.replace(/\.md$/, '.html'));
          if (existsSync(htmlPath)) {
            rmSync(htmlPath, { force: true });
          }
        }
        if (existsSync(destPath)) {
          rmSync(destPath, { recursive: true, force: true });
        }
        rebuild();
        return;
      }

      if (existsSync(srcPath) && !statSync(srcPath).isDirectory()) {
        if (filename.endsWith('.md')) {
          convertMdFile(srcPath, outdir);
          console.log(`  MD -> ${filename.replace(/\.md$/, '.html')}`);
          rebuild();
          return;
        }
        mkdirSync(join(destPath, '..'), { recursive: true });
        writeFileSync(destPath, readFileSync(srcPath));
        console.log(`  Synced: ${filename}`);
      }
    } catch {
      /* ignore */
    }
  });

  // 监听 model/ 模板变化
  watch('model', { recursive: true }, () => {
    console.log('  Model changed, rebuilding...');
    rebuild();
  });
}

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir,
  format: 'esm',
  target: 'es2020',
  minify: isProd,
  sourcemap: !isProd,
};

try {
  if (isServe) {
    copyPublic();
    fullBuild(true);
    watchPublic();
    const ctx = await esbuild.context(config);
    await ctx.watch();
    const { host, port } = await ctx.serve({ servedir: outdir });
    console.log(`Dev server -> http://${host ?? '127.0.0.1'}:${port}`);
  } else if (isWatch) {
    copyPublic();
    fullBuild(true);
    watchPublic();
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('watching...');
  } else {
    copyPublic();
    await esbuild.build(config);
    fullBuild(false);
    console.log(isProd ? 'Production build -> dist/' : 'Build complete');
  }
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
