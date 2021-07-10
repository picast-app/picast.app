export const wrapped = <T>(arr: T[], i: number): T =>
  arr[i >= 0 ? i % arr.length : (arr.length + i) % arr.length]

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

type Zip<T extends unknown[][]> = {
  [I in keyof T]: T[I] extends (infer U)[] ? U : never
}[]

export const zip = <T extends unknown[][]>(...lists: T): Zip<T> =>
  [...Array(Math.min(...lists.map(({ length }) => length)))].map((_, i) =>
    lists.map(l => l[i])
  ) as any

export const zipWith = <T extends unknown[][], U>(
  zipper: (...args: Zip<T>[0]) => U,
  ...lists: T
): U[] =>
  [...Array(Math.min(...lists.map(({ length }) => length)))].map((_, i) =>
    zipper(...(lists.map(l => l[i]) as any))
  )

type Unzip<T extends unknown[]> = { [I in keyof T]: T[I][] }

export const unzip = <T extends unknown[]>(...zipped: T[]): Unzip<T> =>
  zipped.reduce((a, c) => c.map((v, i) => [...(a[i] ?? []), v]), [] as any)

export const unzipWith = <
  T extends unknown[],
  U extends {
    [I in keyof T]: λ<[cur: T[I], acc: any]>
  }
>(
  zipped: T[],
  ...unzippers: U
): { [I in keyof U]: ReturnType<U[I]> } =>
  zipped.reduce((a, c) => c.map((v, i) => unzippers[i](v, a[i])), [] as any)
