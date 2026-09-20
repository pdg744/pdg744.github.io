// Compute shafts and arrowheads in the same coordinates as the rendered circles.
export function factorGraphEdge(from, to, radius, scale, selfLoop = false) {
  const clearance = 2 * scale;
  const edgeRadius = radius + clearance;
  let start, tip, tangent, controls;
  if (selfLoop) {
    const vertical = Math.sqrt(1 - 0.55 ** 2);
    start = { x: from.x - edgeRadius * 0.55, y: from.y - edgeRadius * vertical };
    tip = { x: from.x + edgeRadius * 0.55, y: from.y - edgeRadius * vertical };
    controls = [
      { x: from.x - radius * 1.4, y: from.y - radius - 40 * scale },
      { x: from.x + radius * 1.4, y: from.y - radius - 40 * scale },
    ];
    tangent = { x: tip.x - controls[1].x, y: tip.y - controls[1].y };
  } else {
    const dx = to.x - from.x, dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const ux = dx / distance, uy = dy / distance;
    start = { x: from.x + ux * edgeRadius, y: from.y + uy * edgeRadius };
    tip = { x: to.x - ux * edgeRadius, y: to.y - uy * edgeRadius };
    tangent = { x: ux, y: uy };
  }
  const length = Math.hypot(tangent.x, tangent.y);
  const ux = tangent.x / length, uy = tangent.y / length;
  const headLength = 8 * scale, halfWidth = 3.5 * scale;
  const base = { x: tip.x - ux * headLength, y: tip.y - uy * headLength };
  const shaft = controls
    ? `M ${start.x} ${start.y} C ${controls[0].x} ${controls[0].y}, ${controls[1].x} ${controls[1].y}, ${base.x} ${base.y}`
    : `M ${start.x} ${start.y} L ${base.x} ${base.y}`;
  const head = `M ${tip.x} ${tip.y} L ${base.x - uy * halfWidth} ${base.y + ux * halfWidth} L ${base.x + uy * halfWidth} ${base.y - ux * halfWidth} Z`;
  return { shaft, head, start, tip, base };
}
