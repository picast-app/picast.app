export const isPromise = <T = any>(v: unknown): v is PromiseLike<T> =>
  typeof v === 'object' && v !== null && typeof (v as any).then === 'function'

export const asyncQueue = <TArgs extends any[], TReturn>(
  func: (...args: TArgs) => Promise<TReturn>
) => {
  const queue: Promise<any>[] = []
  return async (...args: TArgs): Promise<TReturn> => {
    const prom = new Promise<TReturn>(async (resolve, reject) => {
      await queue[queue.length - 1]
      try {
        resolve(await func(...args))
      } catch (e) {
        reject(e)
      } finally {
        queue.splice(queue.indexOf(prom), 1)
      }
    })
    queue.push(prom)
    return await prom
  }
}