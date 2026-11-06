import './css/variables.css';
import './css/reset.css';
import './css/typography.css';
import './css/layout.css';
import './css/header.css';
import './css/footer.css';
import './css/card.css';
import './css/post.css';
import './css/tags.css';
import './css/category.css';
import './css/blog-layout.css';
import './css/bg.css';
import './css/home.css';
import './css/utilities.css';
import { initGlobe } from './globe';

/**
 * 主脚本（体积目标：≤ 3KB 压缩后）
 * 所有交互效果优先用 CSS 实现，此脚本仅处理：
 * 1. 移动端汉堡菜单开关
 * 2. 无其他多余逻辑
 *
 * 设计原则：
 * - 零第三方依赖
 * - 使用 ES2020+ 语法（由 esbuild 编译到目标环境）
 * - 不污染全局作用域
 */

/** 初始化移动端导航菜单的开关行为 */
function initMobileNav(): void {
  const toggleBtn = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector<HTMLUListElement>('.nav-links');

  if (!toggleBtn || !navLinks) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggleBtn.classList.toggle('open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
  });
}

/** 初始化主题切换菜单 */
function initThemeToggle(): void {
  const wrapper = document.querySelector<HTMLDivElement>('.theme-toggle-wrapper');
  const btn = wrapper?.querySelector<HTMLButtonElement>('.theme-toggle');
  const menu = wrapper?.querySelector<HTMLDivElement>('.theme-menu');
  const items = menu?.querySelectorAll<HTMLButtonElement>('.theme-menu-item');
  if (!wrapper || !btn || !menu || !items) return;

  const mode = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  applyTheme(mode);
  updateMenu(mode);
  updateButton(mode);

  btn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  for (const item of items) {
    item.addEventListener('click', () => {
      const newMode = item.dataset.mode as 'light' | 'dark' | 'system';
      localStorage.setItem('theme', newMode);
      applyTheme(newMode);
      updateMenu(newMode);
      updateButton(newMode);
      closeMenu();
    });
  }

  const closeMenu = (): void => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  document.addEventListener('click', closeMenu);
}

/** 应用主题：dark 类 + 系统偏好 */
function applyTheme(mode: 'light' | 'dark' | 'system'): void {
  const html = document.documentElement;
  if (mode === 'dark') {
    html.classList.add('dark');
  } else if (mode === 'light') {
    html.classList.remove('dark');
  } else {
    html.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches);
  }
}

/** ?????? */
function updateButton(mode: 'light' | 'dark' | 'system'): void {
  const btn = document.querySelector<HTMLButtonElement>('.theme-toggle');
  if (!btn) return;
  const labels: Record<string, string> = { light: '亮', dark: '暗', system: '系统' };
  btn.textContent = labels[mode];
}

/** 更新菜单选中状态 */
function updateMenu(mode: 'light' | 'dark' | 'system'): void {
  const items = document.querySelectorAll<HTMLButtonElement>('.theme-menu-item');
  for (const item of items) {
    item.classList.toggle('active', item.dataset.mode === mode);
  }
}

/** 初始化博客 TOC 高亮（IntersectionObserver） */
function initTocHighlight(): void {
  const tocItems = document.querySelectorAll<HTMLElement>('.toc-nav__item');
  if (tocItems.length === 0) return;
  const headings = document.querySelectorAll<HTMLElement>('.post-body h2[id], .post-body h3[id]');
  if (headings.length === 0) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.getAttribute('id');
        for (const item of tocItems) {
          const link = item.querySelector('a');
          const active = link?.getAttribute('href') === '#' + id;
          item.classList.toggle('toc-nav__item--active', active);
        }
      }
    },
    { rootMargin: '-60px 0px -60% 0px', threshold: 0 },
  );
  for (const h of headings) observer.observe(h);
}

// DOM 就绪后执行初始化（defer 脚本确保 DOM 已解析）
initPageAnimations();
initGlobe();
initMobileNav();
initThemeToggle();
initTocHighlight();
const app = document.querySelector('#app');
if (app) {
  app.innerHTML = '<h1>Hello, 静态站点已就绪！</h1>';
}

// 椤佃剼骞翠唤鑷姩鏇存柊锛氬厹搴曟樉绀?2025锛孞S 姝ｅ父鏃舵墿灞曚负 2025-{褰撳勾}
const yearEl = document.querySelector<HTMLSpanElement>('[data-year]');
if (yearEl) {
  const currentYear = new Date().getFullYear();
  if (currentYear >= 2026) {
    yearEl.textContent = `2025-${currentYear}`;
  }
}
/** 首页翻页入场动画：观察 snap 页面进入视口时触发 active 类 */
function initPageAnimations(): void {
  const pages = document.querySelectorAll<HTMLElement>('.home-page');
  if (pages.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const page = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          page.classList.remove('active');
          void page.offsetWidth; /* 强制重排以重启动画 */
          page.classList.add('active');
        }
      }
    },
    { threshold: 0.4 },
  );

  for (const page of pages) {
    observer.observe(page);
  }
}
