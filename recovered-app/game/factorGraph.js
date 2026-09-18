// A tidy incoming tree for each destination, with cycles retained as cross-edges.
export function layoutFactorGraph(connections, savedFactors, viewportWidth) {
  const numbers = [
    ...new Set([
      ...connections.flatMap(({ from, to }) => [from, to]),
      ...Object.keys(savedFactors)
        .filter((key) => savedFactors[key].length)
        .map(Number),
    ]),
  ].sort((a, b) => a - b);
  const anchors = new Set([1, 6]);
  const parent = new Map();
  for (const number of numbers) {
    const destinations = connections
      .filter((edge) => edge.from === number && edge.to !== number)
      .map((edge) => edge.to)
      .sort((a, b) => a - b);
    parent.set(number, anchors.has(number) ? null : (destinations[0] ?? null));
  }
  // Break one layout link per cycle. All original arrows are still rendered.
  for (const number of numbers) {
    const path = [],
      seen = new Map();
    let current = number;
    while (current !== null) {
      if (seen.has(current)) {
        parent.set(Math.min(...path.slice(seen.get(current))), null);
        break;
      }
      seen.set(current, path.length);
      path.push(current);
      current = parent.get(current) ?? null;
    }
  }
  const children = new Map(numbers.map((number) => [number, []]));
  for (const number of numbers) {
    if (parent.get(number) !== null)
      children.get(parent.get(number)).push(number);
  }
  const roots = numbers
    .filter((number) => parent.get(number) === null)
    .sort(
      (a, b) => (anchors.has(a) ? 0 : 1) - (anchors.has(b) ? 0 : 1) || a - b,
    );
  const spans = new Map();
  function span(number) {
    if (!spans.has(number)) {
      const branches = children.get(number);
      // Equal sibling slots keep converging branches symmetrical, even with unequal subtrees.
      spans.set(
        number,
        branches.length ? branches.length * Math.max(...branches.map(span)) : 1,
      );
    }
    return spans.get(number);
  }
  const diameter =
    numbers.length <= 4
      ? Math.min(144, (viewportWidth - 52) / 2)
      : viewportWidth < 350
        ? 88
        : 108;
  const pitch = diameter + 48;
  const slots = roots.reduce((sum, root) => sum + span(root), 0);
  const width = Math.max(viewportWidth, slots * pitch);
  const positions = new Map();
  let maxDepth = 0;
  function place(number, center, depth) {
    positions.set(number, { x: center, depth });
    maxDepth = Math.max(maxDepth, depth);
    const branches = children.get(number);
    const spacing = branches.length
      ? (span(number) / branches.length) * pitch
      : 0;
    branches.forEach((child, index) =>
      place(
        child,
        center + (index - (branches.length - 1) / 2) * spacing,
        depth + 1,
      ),
    );
  }
  let offset = (width - slots * pitch) / 2;
  for (const root of roots) {
    const treeWidth = span(root) * pitch;
    place(root, offset + treeWidth / 2, 0);
    offset += treeWidth;
  }
  const top = diameter / 2 + 48;
  const height = Math.max(340, top + maxDepth * pitch + diameter / 2 + 24);
  const baseline = height - diameter / 2 - 24;
  for (const [number, point] of positions)
    positions.set(number, { x: point.x, y: baseline - point.depth * pitch });
  return { numbers, positions, diameter, height, width };
}
