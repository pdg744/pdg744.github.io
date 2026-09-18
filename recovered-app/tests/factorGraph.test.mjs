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
        point.x >= graph.diameter / 2 && point.x <= width - graph.diameter / 2,
      );
      assert.ok(
        point.y >= graph.diameter / 2 &&
          point.y <= graph.height - graph.diameter / 2,
      );
    }
    assert.deepEqual(graph, layoutFactorGraph(edges, {}, width));
  }
});
