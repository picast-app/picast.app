// eslint-disable-next-line @typescript-eslint/ban-types
type obj = object

export const map = <T extends obj>(
  o: T,
  func: <K extends keyof T>(
    k: K,
    v: typeof o[K]
  ) => [string | number | symbol, any]
) => Object.fromEntries(Object.entries(o).map(([k, v]) => func(k as any, v)))

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
    Object.entries(v).map(([k, v]) => (keys.includes(k as any) ? [k, v] : []))
  )

export const omit = <T extends obj, K extends keyof T>(
  v: T,
  ...keys: K[]
): Omit<T, K> =>
  Object.fromEntries(
    Object.entries(v).map(([k, v]) => (keys.includes(k as any) ? [] : [k, v]))
  )
