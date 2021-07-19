export const add = <T>(set: T[], v: T): T[] =>
  set.includes(v) ? [...set] : [...set, v]

export const remove = <T>(set: T[], v: T): T[] => set.filter(e => e !== v)
