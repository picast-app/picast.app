import { isPromise } from 'utils/promise'

export const callAll = <T extends any[] = []>(
  list?: ((...args: T) => any)[],
  ...args: T
) => {
  for (const cb of list ?? []) cb(...args)
}

export const ident = <T>(v: T): T => v

export const bundle = <TA extends any[]>(
  ...funcs: ((...args: TA) => any)[]
) => async (...args: TA): Promise<void> => {
  const res = funcs.map(func => func(...args))
  if (res.some(isPromise)) await Promise.all(res)
}
