import {
  hasAllFactors,
  properFactorSum,
  supportedNumber,
  MAX_EXPLORATIONS,
  FACTOR_DIGITS,
  SUM_DIGITS,
} from "./factorAndAdd.js";

export function emptyFactorProgress() {
  return {
    phase: "choose",
    chosen: null,
    selected: [],
    pairs: [],
    savedFactors: {},
    savedPairs: {},
    factorInput: "",
    pairedInput: "",
    sum: "",
    connections: [],
    latest: null,
  };
}

const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const draft = (value, length) =>
  typeof value === "string" && value.length <= length && /^\d*$/.test(value);

function validFactors(number, selected, pairs) {
  if (
    !Array.isArray(selected) ||
    !Array.isArray(pairs) ||
    selected.length > 2000 ||
    pairs.length > 1000
  )
    return false;
  if (new Set(selected).size !== selected.length) return false;
  const accepted = new Set();
  for (const pair of pairs) {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      !pair.every(supportedNumber) ||
      pair[0] * pair[1] !== number ||
      pair.every((factor) => accepted.has(factor))
    )
      return false;
    pair.forEach((factor) => accepted.add(factor));
  }
  return (
    accepted.size === selected.length &&
    selected.every((factor) => accepted.has(factor))
  );
}

// A saved answer is untrusted input. In particular, old unchecked answers must
// never become accepted pairs, a completed factor step, or a graph edge.
export function validateFactorProgress(value) {
  if (!record(value) || !["choose", "factors", "sum"].includes(value.phase))
    return null;
  if (value.chosen !== null && !supportedNumber(value.chosen)) return null;
  if (value.phase !== "choose" && value.chosen === null) return null;
  if (!validFactors(value.chosen, value.selected, value.pairs)) return null;
  if (value.phase === "sum" && !hasAllFactors(value.chosen, value.selected))
    return null;
  if (
    !draft(value.factorInput, FACTOR_DIGITS) ||
    !draft(value.pairedInput, FACTOR_DIGITS) ||
    !draft(value.sum, SUM_DIGITS)
  )
    return null;
  if (!record(value.savedFactors) || !record(value.savedPairs)) return null;
  const keys = Object.keys(value.savedPairs);
  if (
    keys.length > MAX_EXPLORATIONS ||
    keys.length !== Object.keys(value.savedFactors).length
  )
    return null;
  for (const key of keys) {
    if (
      String(Number(key)) !== key ||
      !supportedNumber(Number(key)) ||
      !Object.hasOwn(value.savedFactors, key) ||
      !validFactors(Number(key), value.savedFactors[key], value.savedPairs[key])
    )
      return null;
  }
  if (
    !Array.isArray(value.connections) ||
    value.connections.length > MAX_EXPLORATIONS
  )
    return null;
  const sources = new Set();
  for (const edge of value.connections) {
    if (
      !record(edge) ||
      !supportedNumber(edge.from) ||
      edge.to !== properFactorSum(edge.from) ||
      sources.has(edge.from)
    )
      return null;
    sources.add(edge.from);
  }
  if (new Set([...keys.map(Number), ...sources]).size > MAX_EXPLORATIONS)
    return null;
  if (
    value.latest !== null &&
    (!record(value.latest) ||
      !value.connections.some(
        (edge) =>
          edge.from === value.latest.from && edge.to === value.latest.to,
      ))
  )
    return null;
  // Pick only durable fields; animation flags and other unknown fields are ignored.
  const restored = Object.fromEntries(
    Object.keys(emptyFactorProgress()).map((key) => [key, value[key]]),
  );
  // Migrate the brief version that allowed exploring 1, preserving other work.
  restored.connections = restored.connections.filter((edge) => edge.from !== 1);
  restored.savedFactors = { ...restored.savedFactors };
  restored.savedPairs = { ...restored.savedPairs };
  delete restored.savedFactors[1];
  delete restored.savedPairs[1];
  if (restored.latest?.from === 1) restored.latest = null;
  if (restored.chosen === 1) {
    Object.assign(restored, {
      phase: "choose",
      chosen: null,
      selected: [],
      pairs: [],
      factorInput: "",
      pairedInput: "",
      sum: "",
    });
  }
  return restored;
}
