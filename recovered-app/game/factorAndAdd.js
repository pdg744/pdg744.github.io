export const STARTING_NUMBERS = Array.from(
  { length: 30 },
  (_, index) => index + 1,
);

// Bound trial division, input width, and graph work while preserving exact sums.
export const MAX_FACTOR_NUMBER = 1_000_000;
export const MAX_EXPLORATIONS = 128;
export const FACTOR_DIGITS = 7;
export const SUM_DIGITS = 8;
export const supportedNumber = (number) =>
  Number.isSafeInteger(number) && number >= 1 && number <= MAX_FACTOR_NUMBER;

export function explorationLimit(number, connections, savedFactors) {
  if (number === 0 || number === 1) return "End of chain";
  if (!supportedNumber(number)) return "Exploration limit: 1,000,000";
  if (connections.some((edge) => edge.from === number)) return "Completed";
  const explored = new Set([
    ...Object.keys(savedFactors).map(Number),
    ...connections.map((edge) => edge.from),
  ]);
  if (!explored.has(number) && explored.size >= MAX_EXPLORATIONS)
    return "Graph limit: 128 explored numbers. Start over to explore more.";
  return null;
}

export function factorsOf(number) {
  if (!supportedNumber(number)) return [];
  const factors = [];
  for (let candidate = 1; candidate * candidate <= number; candidate++) {
    if (number % candidate !== 0) continue;
    factors.push(candidate);
    if (candidate * candidate !== number) factors.push(number / candidate);
  }
  return factors.sort((a, b) => a - b);
}

export function hasAllFactors(number, selected) {
  const expected = factorsOf(number);
  const unique = new Set(selected);
  return (
    supportedNumber(number) &&
    unique.size === expected.length &&
    expected.every((factor) => unique.has(factor))
  );
}

export function factorsToAdd(number, selected) {
  return [...new Set(selected)]
    .filter((factor) => factor !== number)
    .sort((a, b) => a - b);
}

export function properFactorSum(number) {
  return factorsToAdd(number, factorsOf(number)).reduce(
    (sum, factor) => sum + factor,
    0,
  );
}

export function addConnection(connections, from, to) {
  if (connections.some((edge) => edge.from === from && edge.to === to))
    return connections;
  return [...connections, { from, to }];
}
