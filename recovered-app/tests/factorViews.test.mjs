import test from "node:test";
import assert from "node:assert/strict";
import { FACTOR_VIEWS, factorViewColor, matchesFactorView } from "../game/factorViews.js";

test("prime coloring excludes terminal values, squares, and composites", () => {
  for (const n of [2, 3, 17, 997]) assert.equal(matchesFactorView(n, "prime"), true);
  for (const n of [0, 1, 4, 9, 22, 49, 121, 999]) assert.equal(matchesFactorView(n, "prime"), false);
});

test("independent switches combine and removing primes restores parity colors", () => {
  const colors = Object.fromEntries(FACTOR_VIEWS.map(({ id, color }) => [id, color]));
  assert.equal(factorViewColor(3, {}), undefined);
  assert.equal(factorViewColor(3, { even: true }), undefined);
  assert.equal(factorViewColor(9, { odd: true, even: true }), colors.odd);
  assert.equal(factorViewColor(22, { odd: true, even: true }), colors.even);
  assert.equal(factorViewColor(2, { even: true, prime: true }), colors.prime);
  assert.equal(factorViewColor(3, { odd: true, prime: true }), colors.prime);
  assert.equal(factorViewColor(3, { odd: true, prime: false }), colors.odd);
});
