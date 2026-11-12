/** 根据卡片实际中心更新连线，包含入场动画和悬停产生的位移。 */
export function initSitemapLines(): void {
  const container = document.querySelector<HTMLElement>('.home-sitemap__tri');
  const svg = container?.querySelector<SVGSVGElement>('.home-sitemap__lines');
  if (!container || !svg) return;

  const nodes = [
    container.querySelector<HTMLElement>('.home-sitemap__node--top'),
    container.querySelector<HTMLElement>('.home-sitemap__node--left'),
    container.querySelector<HTMLElement>('.home-sitemap__node--right'),
  ];
  const lines = svg.querySelectorAll('line');
  if (nodes.some((node) => !node) || lines.length !== 3) return;

  const update = (): void => {
    const matrix = svg.getScreenCTM();
    if (!matrix || matrix.a * matrix.d - matrix.b * matrix.c === 0) return;
    const inverse = matrix.inverse();
    const centers = nodes.map((node) => {
      const rect = node?.getBoundingClientRect();
      return rect
        ? new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).matrixTransform(inverse)
        : new DOMPoint();
    });
    const edges = [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const;
    for (const [index, [from, to]] of edges.entries()) {
      const line = lines[index];
      const start = centers[from];
      const end = centers[to];
      if (!line || !start || !end) continue;
      line.setAttribute('x1', String(start.x));
      line.setAttribute('y1', String(start.y));
      line.setAttribute('x2', String(end.x));
      line.setAttribute('y2', String(end.y));
    }
  };

  let visible = false;
  let frameId = 0;
  const frame = (): void => {
    update();
    frameId = requestAnimationFrame(frame);
  };
  const refresh = (): void => {
    cancelAnimationFrame(frameId);
    if (visible && !document.hidden) frame();
  };
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    refresh();
  }).observe(container);
  document.addEventListener('visibilitychange', refresh);
  update();
}
