export const clamp = (min: number, n: number, max: number) =>
  Math.max(Math.min(n, max), min)

export * as vec from './vector'

export const d2r = (n: number) => (n / 360) * Math.PI * 2
