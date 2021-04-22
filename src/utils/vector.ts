export type Vec2D = [x: number, y: number]

export const add = (a: Vec2D, b: Vec2D): Vec2D => [a[0] + b[0], a[1] + b[1]]
export const sub = (a: Vec2D, b: Vec2D): Vec2D => [a[0] - b[0], a[1] - b[1]]
export const mult = (v: Vec2D, m: number): Vec2D => [v[0] * m, v[1] * m]
export const div = (v: Vec2D, m: number): Vec2D => [v[0] / m, v[1] / m]

export const equal = (a: Vec2D, b: Vec2D): boolean =>
  a[0] === b[0] && a[1] === b[1]

export const mag = ([x, y]: Vec2D): number => Math.sqrt(x ** 2 + y ** 2)
export const normal = (v: Vec2D): Vec2D => div(v, mag(v))

export const smallerMag = (v: Vec2D, m: number): number =>
  Math.abs(v[0]) + Math.abs(v[1]) >= m ? m : Math.min(mag(v), m)

export const rotate = ([x, y]: Vec2D, a: number): Vec2D => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
]
