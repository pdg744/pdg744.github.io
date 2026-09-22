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
  const anchors = new Set([0, 1, 6]);
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
  const diameter =
    numbers.length <= 4
      ? Math.min(144, (viewportWidth - 52) / 2)
      : viewportWidth < 350
        ? 88
        : 108;
  const pitch = diameter + 36;
  const gap = diameter + 24;
  // Reserve each branch's full horizontal span, even at unoccupied depths.
  // Unrelated branches must not appear to share a column.
  function tree(number) {
    const branches = children.get(number).map(tree);
    const offsets = [];
    branches.forEach((branch, index) => {
      offsets.push(index === 0 ? 0 :
        offsets[index - 1] + branches[index - 1].right - branch.left + gap);
    });
    const center = (offsets.at(-1) ?? 0) / 2;
    const points = new Map([[number, { x: 0, depth: 0 }]]);
    let left = 0, right = 0;
    branches.forEach((branch, index) => {
      const offset = offsets[index] - center;
      for (const [child, point] of branch.points) {
        const x = point.x + offset, depth = point.depth + 1;
        points.set(child, { x, depth });
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    });
    return { points, left, right };
  }
  const positions = new Map();
  let occupiedRight = null;
  let maxDepth = 0;
  for (const root of roots) {
    const branch = tree(root);
    const offset = occupiedRight === null ? 0 : occupiedRight - branch.left + gap;
    for (const [number, point] of branch.points) {
      const x = point.x + offset;
      positions.set(number, { x, depth: point.depth });
      maxDepth = Math.max(maxDepth, point.depth);
    }
    occupiedRight = branch.right + offset;
  }
  const xs = [...positions.values()].map((point) => point.x);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const contentWidth = maxX - minX + diameter + 48;
  const width = Math.max(viewportWidth, contentWidth);
  for (const point of positions.values())
    point.x += -minX + diameter / 2 + 24 + (width - contentWidth) / 2;
  const top = diameter / 2 + 48;
  const height = Math.max(340, top + maxDepth * pitch + diameter / 2 + 24);
  const baseline = height - diameter / 2 - 24;
  for (const [number, point] of positions)
    positions.set(number, { x: point.x, y: baseline - point.depth * pitch });
  return { numbers, positions, diameter, height, width };
}

// A dense, wide tree uses the phone's height better when its arrows run sideways.
export function fitFactorGraph(graph, width, height) {
  const uprightScale = Math.min(1, width / graph.width, height / graph.height);
  const sidewaysHeight = graph.width + 48; // Reserve space above self-loop arrows.
  const sidewaysScale = Math.min(1, width / graph.height, height / sidewaysHeight);
  const sideways = width < 500 && graph.numbers.length >= 8 && sidewaysScale > uprightScale * 1.2;
  const scale = sideways ? sidewaysScale : uprightScale;
  const sourceWidth = sideways ? graph.height : graph.width;
  const sourceHeight = sideways ? sidewaysHeight : graph.height;
  const positions = new Map([...graph.positions].map(([number, point]) => [number, {
    x: (sideways ? point.y : point.x) * scale + (width - sourceWidth * scale) / 2,
    y: (sideways ? graph.width - point.x + 24 : point.y) * scale + (height - sourceHeight * scale) / 2,
  }]));
  return { positions, scale, diameter: graph.diameter * scale, sideways };
}
