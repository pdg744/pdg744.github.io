export const FACTOR_VIEWS = [
  { id: "odd", label: "Odds", color: "#8BB8FF" },
  { id: "even", label: "Evens", color: "#7ECEC8" },
  { id: "prime", label: "Primes", color: "#D5AAFF" },
];

export function matchesFactorView(number, view) {
  if (view === "odd") return number % 2 === 1;
  if (view === "even") return number % 2 === 0;
  if (view === "prime") {
    if (!Number.isSafeInteger(number) || number < 2) return false;
    for (let divisor = 2; divisor * divisor <= number; divisor++) {
      if (number % divisor === 0) return false;
    }
    return true;
  }
  return false;
}

export function factorViewColor(number, views) {
  // Primes are the more specific pattern when parity is also enabled.
  return [...FACTOR_VIEWS].reverse().find(
    (view) => views[view.id] && matchesFactorView(number, view.id),
  )?.color;
}
