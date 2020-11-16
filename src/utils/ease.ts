const { sin, cos, PI } = Math

export const easeInSine = (x: number) => 1 - cos((x * PI) / 2)
export const easeOutSine = (x: number) => sin((x * PI) / 2)
export const easeInOutSine = (x: number) => -(cos(PI * x) - 1) / 2

export const easeInQuad = (x: number) => x ** 2
export const easeOutQuad = (x: number) => 1 - (1 - x) ** 2
export const easeInOutQuad = (x: number) =>
  x < 0.5 ? 2 * x ** 2 : 1 - (-2 * x + 2) ** 2 / 2

export const easeInCubic = (x: number) => x ** 3
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3
export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2

export const easeInQuart = (x: number) => x ** 4
export const easeOutQuart = (x: number) => 1 - (1 - x) ** 4
export const easeInOutQuart = (x: number) =>
  x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2

export const easeInQuint = (x: number) => x ** 5
export const easeOutQuint = (x: number) => 1 - (1 - x) ** 5
export const easeInOutQuint = (x: number) =>
  x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2

export const easeInExpo = (x: number) => (x === 0 ? 0 : 2 ** (10 * x - 10))
export const easeOutExpo = (x: number) => (x === 1 ? 1 : 1 - 2 ** (-10 * x))
export const easeInOutExpo = (x: number) =>
  x === 0 || x === 1
    ? x
    : x < 0.5
    ? 2 ** (20 * x - 10) / 2
    : (2 - 2 ** (-20 * x + 10)) / 2

export const easeInCirc = (x: number) => 1 - Math.sqrt(1 - x ** 2)
export const easeOutCirc = (x: number) => Math.sqrt(1 - (x - 1) ** 2)
export const easeInOutCirc = (x: number) =>
  x < 0.5
    ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2
    : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2

const c1 = 1.70158
const c2 = c1 * 1.525
const c3 = c1 + 1
const c4 = (2 * Math.PI) / 3
const c5 = (2 * Math.PI) / 4.5

export const easeInBack = (x: number) => c3 * x ** 3 - c1 * x ** 2
export const easeOutBack = (x: number) =>
  1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
export const easeInOutBack = (x: number) =>
  x < 0.5
    ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2
    : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2

export const easeInElastic = (x: number) =>
  x === 0 ? 0 : x === 1 ? 1 : -(2 ** (10 * x - 10)) * sin((x * 10 - 10.75) * c4)
export const easeOutElastic = (x: number) =>
  x === 0 ? 0 : x === 1 ? 1 : 2 ** (-10 * x) * sin((x * 10 - 0.75) * c4) + 1
export const easeInOutElastic = (x: number) =>
  x === 0 || x === 1
    ? x
    : x < 0.5
    ? -(2 ** (20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
    : (2 ** (-20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1

export const easeInBounce = (x: number) => 1 - easeOutBounce(1 - x)
export function easeOutBounce(x: number): number {
  const n1 = 7.5625
  const d1 = 2.75

  if (x < 1 / d1) {
    return n1 * x * x
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375
  }
}
export const easeInOutBounce = (x: number) =>
  x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2
