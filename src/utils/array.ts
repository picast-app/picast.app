import * as predicate from 'snatchblock/predicate'
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

export const set = <T>(arr: T[], i: number, v: T) =>
  [...[...arr, ...Array(i)].slice(0, i), v, ...arr.slice(i + 1)] as T[]

export const remove = <T>(arr: T[], v: T) => {
  let i: number
  while ((i = arr.indexOf(v)) >= 0) arr.splice(i, 1)
}

export const removeMatch = <T>(arr: T[], match: (v: T) => boolean) => {
  const i = arr.findIndex(v => match(v))
  if (i >= 0) arr.splice(i, 1)
}

export const removeMatchAll = <T>(arr: T[], match: (v: T) => boolean) => {
  for (let i = 0; i < arr.length; i++) if (match(arr[i])) arr.splice(i--, 1)
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

export const notNullish = <T>(arr: (T | null | undefined)[]): T[] =>
  arr.filter(predicate.notNullish)

type Part = {
  <T, S extends T>(list: T[], predicate: (el: T) => el is S): [
    S[],
    Exclude<T, S>[]
  ]
  <T>(list: T[], predicate: (el: T) => unknown): [T[], T[]]
}

export const partition: Part = <T>(list: T[], predicate: (el: T) => unknown) =>
  list.reduce(
    ([t, f], c) => (predicate(c) ? [[...t, c], f] : [t, [...f, c]]) as any,
    [[], []]
  ) as any
