import { prefix as strPrefix } from 'snatchblock/string'
import type { Prefix, StringCase } from 'snatchblock/types'
export { pick, omit } from 'snatchblock/object'

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
): Promise<{ [K in keyof T]: PromType<R> }> =>
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

export const omitNullish = <T extends obj>(
  obj: T
): OmitValue<T, undefined | null> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as any

export const prefix = <
  T extends obj,
  TP extends string,
  C extends StringCase | void = void
>(
  obj: T,
  prefix: TP,
  caseMod?: C
): { [K in keyof T as Prefix<K extends string ? K : '?', TP, C>]: T[K] } =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [strPrefix(prefix, k, caseMod), v])
  ) as any
