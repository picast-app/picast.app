export * from 'snatchblock/math'

export * as vec from './vector'

// degree to radian
export const d2r = (n: number) => (n / 360) * Math.PI * 2

// side ratio of box enclosing equilateral triangle
export const equiTriBoxRatio = (side: number) =>
  Math.sqrt(side ** 2 - (side / 2) ** 2)
