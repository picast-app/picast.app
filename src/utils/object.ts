type obj = Record<string | number | symbol, any>

export const map = <T extends obj>(
  o: T,
  func: <K extends keyof T>(
    k: K,
    v: typeof o[K]
  ) => [string | number | symbol, any]
) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => func(k as keyof T, v)))

export const mapValues = <T extends obj, R>(
  o: T,
  func: <K extends keyof T>(v: typeof o[K], k: K) => R
): { [K in keyof T]: R } =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, func(v, k as keyof T)])
  ) as any

export const mapValuesAsync = async <T extends obj, R extends Promise<any>>(
  o: T,
  func: <K extends keyof T>(v: typeof o[K], k: K) => R
): Promise<{ [K in keyof T]: PromiseType<R> }> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(o).map(([k, v]) => func(v, k as keyof T).then(r => [k, r]))
    )
  ) as any

export const mapList = <T extends obj, R>(
  o: T,
  func: <K extends keyof T>(v: T[K], k: K) => R
): R[] => Object.entries(o).map(([k, v]) => func(v, k))

export const forEach = <T extends obj>(
  v: T,
  cb: <K extends keyof T>(k: K, v: T[K]) => unknown
): void => Object.entries(v).forEach(([k, v]) => cb(k, v))

export const filter = <T extends obj>(
  o: T,
  func: <K extends keyof T>(k: K, v: typeof o[K]) => boolean
): Partial<T> =>
  Object.fromEntries(
    Object.entries(o).filter(([k, v]) => func(k as any, v))
  ) as Partial<T>

export const pick = <T extends obj, K extends keyof T>(
  v: T,
  ...keys: K[]
): Pick<T, K> =>
  Object.fromEntries(
    Object.entries(v).flatMap(([k, v]) =>
      keys.includes(k as any) ? [[k, v]] : []
    )
  ) as any

export const omit = <T extends obj, K extends keyof T>(
  v: T,
  ...keys: K[]
): Omit<T, K> =>
  Object.fromEntries(
    Object.entries(v).flatMap(([k, v]) =>
      keys.includes(k as any) ? [] : [[k, v]]
    )
  ) as any
