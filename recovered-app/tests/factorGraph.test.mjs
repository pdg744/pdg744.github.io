import test from "node:test";
import assert from "node:assert/strict";
import { layoutFactorGraph } from "../game/factorGraph.js";

test("graph includes work and destinations, not the unvisited number grid", () => {
  const graph = layoutFactorGraph(
    [{ from: 8, to: 7 }],
    { 8: [1, 8, 2, 4], 12: [1, 12], 9: [] },
    327,
  );
  assert.deepEqual(new Set(graph.numbers), new Set([8, 7, 12]));
  assert.equal(graph.positions.has(30), false);
});

test("layout supports loops, cycles, disconnected paths and outside-range results", () => {
  const edges = [
    { from: 6, to: 6 },
    { from: 220, to: 284 },
    { from: 284, to: 220 },
    { from: 8, to: 7 },
    { from: 7, to: 1 },
  ];
  for (const width of [272, 600]) {
    const graph = layoutFactorGraph(edges, {}, width);
    assert.equal(graph.numbers.length, 6);
    for (const point of graph.positions.values()) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(
        point.x >= graph.diameter / 2 &&
          point.x <= graph.width - graph.diameter / 2,
      );
      assert.ok(
        point.y >= graph.diameter / 2 &&
          point.y <= graph.height - graph.diameter / 2,
      );
    }
    assert.deepEqual(graph, layoutFactorGraph(edges, {}, width));
  }
});

test("small graphs enlarge nodes and dense graphs keep nodes separated", () => {
  for (const width of [272, 342, 600]) {
    const small = layoutFactorGraph([{ from: 24, to: 36 }], {}, width);
    const edges = Array.from({ length: 29 }, (_, i) => ({
      from: i + 2,
      to: i + 1,
    }));
    const large = layoutFactorGraph(edges, {}, width);
    assert.ok(small.diameter > large.diameter);
    const points = [...large.positions.values()];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        assert.ok(
          Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) >=
            large.diameter + 19.9,
        );
      }
    }
  }
});

test("chains form columns and 1 and 6 share the bottom baseline", () => {
  const graph = layoutFactorGraph(
    [
      { from: 8, to: 7 },
      { from: 7, to: 1 },
      { from: 6, to: 6 },
    ],
    {},
    600,
  );
  for (const number of [8, 7])
    assert.equal(graph.positions.get(number).x, graph.positions.get(1).x);
  assert.ok(graph.positions.get(8).y < graph.positions.get(7).y);
  assert.ok(graph.positions.get(7).y < graph.positions.get(1).y);
  assert.equal(graph.positions.get(1).y, graph.positions.get(6).y);
});

test("incoming branches are symmetric and independent of discovery order", () => {
  const edges = [
    { from: 8, to: 7 },
    { from: 7, to: 1 },
    { from: 3, to: 1 },
    { from: 5, to: 1 },
    { from: 6, to: 6 },
  ];
  const graph = layoutFactorGraph(edges, {}, 342);
  const root = graph.positions.get(1),
    left = graph.positions.get(3),
    middle = graph.positions.get(5),
    right = graph.positions.get(7);
  assert.equal(root.x - left.x, right.x - root.x);
  assert.equal(middle.x, root.x);
  assert.equal(left.y, right.y);
  assert.deepEqual(graph, layoutFactorGraph([...edges].reverse(), {}, 342));
  assert.ok(graph.width > 342);
});
