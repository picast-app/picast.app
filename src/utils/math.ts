export const clamp = (min: number, n: number, max: number) =>
  Math.max(Math.min(n, max), min)
