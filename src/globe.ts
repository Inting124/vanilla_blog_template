/**
 * 背景线框地球 — Canvas 真 3D 正交投影渲染
 *
 * 设计要点：
 * - 地轴先向观察者倾 13°（纬线因此呈现弧线而非侧视直线），
 *   再在屏幕平面内右倾 23.5°；绕地轴连续单向自转（永不停顿、不换向）
 * - 昼半球 = 面向观察者的半球（z > 0，亮色），夜半球 = 背对（暗色）
 * - 每条经/纬线按 z 符号拆成昼/夜两段路径分别描边，
 *   两段只在单点相接、零重叠，避免双层描边的抗锯齿发脏
 * - 颜色取自 CSS 变量 --mesh-node（昼）/ --mesh-line（夜），跟随主题切换
 * - 零依赖；页面不可见时 requestAnimationFrame 自动暂停
 */

/** 地轴右倾角（度） */
const TILT_DEG = 23.5;
/** 地轴向观察者的倾角（度）：使视线不平行于纬圈平面，纬线才呈椭圆弧 */
const AXIS_TOWARD_VIEWER_DEG = 13;
/** 自转一周耗时（毫秒） */
const ROTATION_PERIOD_MS = 48_000;
/** 经线数量（间隔 15°） */
const MERIDIAN_COUNT = 24;
/** 纬线范围与间隔（度）；极圈纬线随球体放大恒在屏幕外 */
const PARALLEL_MAX_DEG = 75;
const PARALLEL_STEP_DEG = 15;
/** 球面折线采样步长（度），越小越平滑 */
const SAMPLE_STEP_DEG = 2;
/** 线宽（CSS px）：经线最粗；纬线细一档；赤道单独略加重 */
const LINE_WIDTH_MERIDIAN = 1.8;
const LINE_WIDTH_PARALLEL = 1.2;
const LINE_WIDTH_EQUATOR = 1.5;
/** 纬线（含赤道）整体透明度系数，让经线成为视觉主角 */
const PARALLEL_ALPHA = 0.8;

const DEG = Math.PI / 180;
const TILT_RAD = TILT_DEG * DEG;
const COS_TILT = Math.cos(TILT_RAD);
const SIN_TILT = Math.sin(TILT_RAD);
const VIEW_RAD = AXIS_TOWARD_VIEWER_DEG * DEG;
const COS_VIEW = Math.cos(VIEW_RAD);
const SIN_VIEW = Math.sin(VIEW_RAD);

interface GlobeColors {
  day: string;
  night: string;
}

/** 屏幕坐标点（含深度，用于昼夜分段） */
interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

/** 路径落笔状态：避免同一路径内出现多余的 moveTo 断点 */
interface Pen {
  down: boolean;
}

/** 从 CSS 变量读取昼夜线色 */
function readColors(): GlobeColors {
  const style = getComputedStyle(document.documentElement);
  return {
    day: style.getPropertyValue('--mesh-node').trim() || 'rgba(0, 0, 0, 0.15)',
    night: style.getPropertyValue('--mesh-line').trim() || 'rgba(0, 0, 0, 0.08)',
  };
}

/**
 * 球面点（纬度 lat、经度 lon，弧度）经自转角 rot 旋转、地轴倾斜后投影到屏幕。
 * 球坐标系：z 轴朝向观察者。先绕 x 轴让地轴向观察者倾 13°（z 随之变化，
 * 昼夜划分以倾斜后的 z 为准），再绕视轴做屏幕平面内的 23.5° 右倾。
 */
function project(
  lat: number,
  lon: number,
  rot: number,
  cx: number,
  cy: number,
  radius: number,
): ProjectedPoint {
  const lambda = lon + rot;
  const x = Math.cos(lat) * Math.sin(lambda);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lambda);
  // 地轴向观察者倾：北极获得朝向观察者的 z 分量
  const y1 = y * COS_VIEW - z * SIN_VIEW;
  const z1 = y * SIN_VIEW + z * COS_VIEW;
  // 地轴右倾：x' = x·cosτ + y·sinτ，使北极倒向屏幕右侧
  const tx = x * COS_TILT + y1 * SIN_TILT;
  const ty = -x * SIN_TILT + y1 * COS_TILT;
  return { x: cx + tx * radius, y: cy - ty * radius, z: z1 };
}

/** 将一段球面线段按昼夜（z 符号）追加到对应路径，跨界时在线性插值点处截断 */
function addSegment(
  dayPath: Path2D,
  nightPath: Path2D,
  dayPen: Pen,
  nightPen: Pen,
  a: ProjectedPoint,
  b: ProjectedPoint,
): void {
  const aDay = a.z > 0;
  const bDay = b.z > 0;

  if (aDay === bDay) {
    const path = aDay ? dayPath : nightPath;
    const pen = aDay ? dayPen : nightPen;
    if (!pen.down) path.moveTo(a.x, a.y);
    path.lineTo(b.x, b.y);
    pen.down = true;
    return;
  }

  // 跨越昼夜分界线：t 为交点在 a→b 上的比例
  const t = a.z / (a.z - b.z);
  const mx = a.x + (b.x - a.x) * t;
  const my = a.y + (b.y - a.y) * t;

  const firstPath = aDay ? dayPath : nightPath;
  const firstPen = aDay ? dayPen : nightPen;
  if (!firstPen.down) firstPath.moveTo(a.x, a.y);
  firstPath.lineTo(mx, my);
  firstPen.down = true;

  const secondPath = aDay ? nightPath : dayPath;
  const secondPen = aDay ? nightPen : dayPen;
  secondPath.moveTo(mx, my);
  secondPath.lineTo(b.x, b.y);
  secondPen.down = true;
}

/** 初始化背景线框地球；页面无 .bg-globe 容器时不做任何事 */
export function initGlobe(): void {
  const container = document.querySelector<HTMLElement>('.bg-globe');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-globe__canvas';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let colors = readColors();
  let width = 0;
  let height = 0;

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /** 绘制某一自转角下的一帧：夜半球在下、昼半球在上 */
  const draw = (rot: number): void => {
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) / 2;
    const cx = width / 2;
    const cy = height / 2;
    // 经线 / 纬线 / 赤道各自分昼夜两条路径，便于分别设置线宽与透明度
    const meridianDay = new Path2D();
    const meridianNight = new Path2D();
    const parallelDay = new Path2D();
    const parallelNight = new Path2D();
    const equatorDay = new Path2D();
    const equatorNight = new Path2D();

    // 经线：从南极到北极的半圆
    for (let m = 0; m < MERIDIAN_COUNT; m++) {
      const lon = (m / MERIDIAN_COUNT) * Math.PI * 2;
      const dayPen: Pen = { down: false };
      const nightPen: Pen = { down: false };
      let prev = project(-Math.PI / 2, lon, rot, cx, cy, radius);
      for (let s = -90 + SAMPLE_STEP_DEG; s <= 90; s += SAMPLE_STEP_DEG) {
        const cur = project(s * DEG, lon, rot, cx, cy, radius);
        addSegment(meridianDay, meridianNight, dayPen, nightPen, prev, cur);
        prev = cur;
      }
    }

    // 纬线：整圆环；赤道（0°）单独成组以便加重
    for (let p = -PARALLEL_MAX_DEG; p <= PARALLEL_MAX_DEG; p += PARALLEL_STEP_DEG) {
      const lat = p * DEG;
      const dayPath = p === 0 ? equatorDay : parallelDay;
      const nightPath = p === 0 ? equatorNight : parallelNight;
      const dayPen: Pen = { down: false };
      const nightPen: Pen = { down: false };
      let prev = project(lat, 0, rot, cx, cy, radius);
      for (let s = SAMPLE_STEP_DEG; s <= 360; s += SAMPLE_STEP_DEG) {
        const cur = project(lat, s * DEG, rot, cx, cy, radius);
        addSegment(dayPath, nightPath, dayPen, nightPen, prev, cur);
        prev = cur;
      }
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // 夜半球在下、昼半球在上；纬线整体 0.8 透明度
    ctx.globalAlpha = PARALLEL_ALPHA;
    ctx.lineWidth = LINE_WIDTH_PARALLEL;
    ctx.strokeStyle = colors.night;
    ctx.stroke(parallelNight);
    ctx.lineWidth = LINE_WIDTH_EQUATOR;
    ctx.stroke(equatorNight);
    ctx.strokeStyle = colors.day;
    ctx.lineWidth = LINE_WIDTH_PARALLEL;
    ctx.stroke(parallelDay);
    ctx.lineWidth = LINE_WIDTH_EQUATOR;
    ctx.stroke(equatorDay);
    ctx.globalAlpha = 1;
    ctx.lineWidth = LINE_WIDTH_MERIDIAN;
    ctx.strokeStyle = colors.night;
    ctx.stroke(meridianNight);
    ctx.strokeStyle = colors.day;
    ctx.stroke(meridianDay);
  };

  resize();

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (reducedMotion.matches) {
    // 减少动态：只画一帧静态地球
    draw(0);
  } else {
    let rotation = 0;
    let lastTime = 0;
    const frame = (now: number): void => {
      if (lastTime > 0) {
        rotation += ((now - lastTime) / ROTATION_PERIOD_MS) * Math.PI * 2;
        rotation %= Math.PI * 2;
      }
      lastTime = now;
      draw(rotation);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // 主题切换（html.dark 类变化或系统偏好变化）时重读颜色
  const refreshColors = (): void => {
    colors = readColors();
    if (reducedMotion.matches) draw(0);
  };
  new MutationObserver(refreshColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshColors);

  // 容器尺寸变化（视口缩放、断点切换 --R）时重设画布分辨率
  new ResizeObserver(() => {
    resize();
    if (reducedMotion.matches) draw(0);
  }).observe(container);
}
