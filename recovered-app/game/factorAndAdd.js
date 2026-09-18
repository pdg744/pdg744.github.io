export const STARTING_NUMBERS = Array.from(
  { length: 30 },
  (_, index) => index + 1,
);

export function factorsOf(number) {
  return STARTING_NUMBERS.filter(
    (candidate) => candidate <= number && number % candidate === 0,
  );
}

export function hasAllFactors(number, selected) {
  const expected = factorsOf(number);
  const unique = new Set(selected);
  return (
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
