
export function toOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatPercent(n: number, fractionalDigits: number) {
  return `${(n * 100).toFixed(fractionalDigits)}%`;
}
