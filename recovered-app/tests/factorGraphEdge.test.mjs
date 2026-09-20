import test from "node:test";
import assert from "node:assert/strict";
import { factorGraphEdge } from "../game/factorGraphEdge.js";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);

test("arrow tips meet destination boundaries from every direction at every scale", () => {
  for (const scale of [0.08, 0.25, 0.6, 1]) {
    const radius = 44 * scale;
    for (const [x, y] of [[0, 150], [150, 0], [-150, 0], [80, -150], [-80, 150]]) {
      const from = { x: 200 * scale, y: 200 * scale };
      const to = { x: from.x + x * scale, y: from.y + y * scale };
      const arrow = factorGraphEdge(from, to, radius, scale);
      close(Math.hypot(arrow.tip.x - to.x, arrow.tip.y - to.y), radius + 2 * scale);
      close(Math.hypot(arrow.start.x - from.x, arrow.start.y - from.y), radius + 2 * scale);
      close(Math.hypot(arrow.base.x - arrow.tip.x, arrow.base.y - arrow.tip.y), 8 * scale);
      assert.ok(Math.hypot(arrow.base.x - to.x, arrow.base.y - to.y) > radius);
      assert.ok(!/NaN|Infinity/.test(arrow.shaft + arrow.head));
    }
  }
});

test("self-loop arrowheads end outside their own circle at every scale", () => {
  for (const scale of [0.08, 0.25, 1]) {
    const center = { x: 100, y: 100 };
    const radius = 44 * scale;
    const arrow = factorGraphEdge(center, center, radius, scale, true);
    close(Math.hypot(arrow.tip.x - center.x, arrow.tip.y - center.y), radius + 2 * scale);
    assert.ok(arrow.start.x < center.x && arrow.tip.x > center.x);
    assert.ok(arrow.base.y < arrow.tip.y);
    assert.ok(!/NaN|Infinity/.test(arrow.shaft + arrow.head));
  }
});
