export const easeInCubic = (x: number) => x ** 3
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3

export const easeInCirc = (x: number) => 1 - Math.sqrt(1 - x ** 2)
export const easeOutCirc = (x: number) => Math.sqrt(1 - (x - 1) ** 2)
