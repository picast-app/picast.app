import { isPromise } from './promise'

export const wrap = <T extends λ>(func: T, prefix = '', fName = func.name) =>
  ((...args: Parameters<T>): ReturnType<T> => {
    const t0 = performance.now()
    const log = () => {
      if (typeof fName !== 'string') fName = '[?]'
      logger.info(
        `${prefix}${fName}(${args
          .map(v => JSON.stringify(v))
          .join(', ')}) took ${
          Math.round((performance.now() - t0) * 100) / 100
        } ms`
      )
    }

    let isProm = false
    try {
      const res = func(...args)
      if ((isProm = isPromise(res))) res.finally(log)
      return res
    } finally {
      if (!isProm) log()
    }
  }) as T
