// Lay out only the numbers the learner has brought into the graph.
// Cycles and perfect-number loops are valid, so this is not a DAG-only layout.
export function layoutFactorGraph(connections, savedFactors, width) {
  const numbers = [
    ...new Set([
      ...connections.flatMap(({ from, to }) => [from, to]),
      ...Object.keys(savedFactors)
        .filter((key) => savedFactors[key].length)
        .map(Number),
    ]),
  ];
  const diameter = width < 350 ? 80 : 96;
  const height = Math.max(
    300,
    Math.ceil(numbers.length / Math.max(2, Math.floor(width / 150))) * 150,
  );
  const margin = diameter / 2 + 28;
  const positions = new Map(
    numbers.map((number, index) => {
      const angle = (2 * Math.PI * index) / Math.max(1, numbers.length);
      return [
        number,
        {
          x: width / 2 + Math.cos(angle) * (width / 2 - margin),
          y: height / 2 + Math.sin(angle) * (height / 2 - margin),
        },
      ];
    }),
  );
  for (let step = 0; step < 240; step++) {
    const forces = new Map(numbers.map((number) => [number, { x: 0, y: 0 }]));
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = positions.get(numbers[i]),
          b = positions.get(numbers[j]);
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const strength = Math.min(15, 4500 / (distance * distance));
        forces.get(numbers[i]).x -= (dx / distance) * strength;
        forces.get(numbers[i]).y -= (dy / distance) * strength;
        forces.get(numbers[j]).x += (dx / distance) * strength;
        forces.get(numbers[j]).y += (dy / distance) * strength;
      }
    }
    for (const { from, to } of connections) {
      if (from === to) continue;
      const a = positions.get(from),
        b = positions.get(to);
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const strength = (distance - diameter - 65) * 0.025;
      forces.get(from).x += (dx / distance) * strength;
      forces.get(from).y += (dy / distance) * strength;
      forces.get(to).x -= (dx / distance) * strength;
      forces.get(to).y -= (dy / distance) * strength;
    }
    for (const number of numbers) {
      const point = positions.get(number),
        force = forces.get(number);
      point.x = Math.max(
        margin,
        Math.min(
          width - margin,
          point.x + force.x + (width / 2 - point.x) * 0.002,
        ),
      );
      point.y = Math.max(
        margin,
        Math.min(
          height - margin,
          point.y + force.y + (height / 2 - point.y) * 0.002,
        ),
      );
    }
  }
  return { numbers, positions, diameter, height };
}
