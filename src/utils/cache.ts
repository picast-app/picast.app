import { oneOf } from 'utils/equal'

const caches = new Map<(...args: any[]) => any, Record<number | string, any>>()

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  key: (...args: Parameters<T>) => number | string = (...args: any[]) =>
    args.length === 1 && oneOf(typeof args[0], 'string', 'number')
      ? args[0]
      : JSON.stringify(args)
) => (...args: Parameters<T>): ReturnType<T> => {
  if (!caches.has(func)) caches.set(func, {})
  const results = caches.get(func)!
  const keyArg = key(...args)
  return (results[keyArg] ??= func(...args))
}
