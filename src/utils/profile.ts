import { isPromise } from './promise'

export const wrap =
  <T extends λ>(func: T, prefix = '') =>
  (...args: Parameters<T>): ReturnType<T> => {
    const t0 = performance.now()
    const log = () => {
      logger.info(
        `${prefix}.${func.name}(${args.join(',')}) took ${
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
  }
