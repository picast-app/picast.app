export * from 'snatchblock/list'

export const min = <T>(list: T[], sel: (el: T) => number): T => {
  if (list.length <= 1) return list[0]
  let candidate = list[0]
  let candidateN = sel(list[0])

  for (let i = 1; i < list.length; i++) {
    const n = sel(list[i])
    if (n < candidateN) {
      candidateN = n
      candidate = list[i]
    }
  }

  return candidate
}

export const collection = <T, K extends string | number, R = T>(
  list: T[],
  key: (v: T) => K,
  value?: (v: T) => R
): Record<K, R> =>
  Object.fromEntries(list.map(v => [key(v), value ? value(v) : v])) as any

export const sum = (...ns: number[]) => ns.reduce((a, c) => a + c, 0)

export const diff = <T>(
  oldSet: T[],
  newSet: T[]
): [added: T[], removed: T[]] => [
  newSet.filter(v => !oldSet.includes(v)),
  oldSet.filter(v => !newSet.includes(v)),
]

export const set = <T extends any[]>(arr: T, i: number, v: T) =>
  [...[...arr, ...Array(i)].slice(0, i), v, ...arr.slice(i + 1)] as T

export const remove = <T>(arr: T[], v: T) => {
  let i: number
  while ((i = arr.indexOf(v)) >= 0) arr.splice(i, 1)
}

export const last = <T extends unknown[]>(arr: T) =>
  arr.slice(-1)[0] as T extends [...unknown[], infer U] ? U : undefined

export const nestMap = <T extends Nested<any>, U>(
  list: T,
  cb: (v: T extends Nested<infer I> ? I : unknown) => U
): MappedNested<T, U> =>
  list.map(v => (Array.isArray(v) ? nestMap(v as T, cb) : cb(v))) as any

type Nested<T> = (T | Nested<T>)[]
type MappedNested<T extends Nested<any>, U> = {
  [K in keyof T]: T[K] extends any[] ? MappedNested<T[K], U> : U
}
