// Recovered from Metro module 696. See ../../recovery/README.md.
export function pushFromCenter(x, y, centerX, centerY, offset = 8) {
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const scale = distance > 0 ? (distance + offset) / distance : 1;
  return [centerX + (x - centerX) * scale, centerY + (y - centerY) * scale];
}
export function midpointBoxSize(generation, outerSide) {
  const sideLength = outerSide / Math.pow(Math.SQRT2, generation);
  const proportionalSize = Math.max(n, 0.35 * sideLength);
  return Math.min(proportionalSize, Math.max(n, t - 4 * generation));
}
const t = 40;
const n = 14;
