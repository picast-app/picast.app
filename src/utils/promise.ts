export const isPromise = <T = any>(v: unknown): v is Promise<T> =>
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

export const asyncQueued = () => {
  const queue = asyncQueue((f: λ, ...args: any[]) => f(...args))
  return <T extends λ>(f: T, immediate?: λ<Parameters<T>>) =>
    async (...args: Parameters<T>): Promise<PromType<ReturnType<T>>> =>
      (immediate?.(...args), await queue(f, ...args)) as any
}

export const waiter = <T>(): [Promise<T>, (v: T) => void] => {
  let initializer: (v: T) => void
  const asr = new Promise<T>(res => {
    initializer = res
  })
  return [asr, initializer!]
}

export const promiseCB =
  <T>(func: () => Promise<T>) =>
  async (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void
  ) => {
    try {
      resolve(await func())
    } catch (e) {
      reject(e)
    }
  }

export const allFlat = async <T>(proms: Promise<T[]>[]): Promise<T[]> =>
  (await Promise.all(proms)).flat()

export const wait = <
  T extends (cb: () => void, ...rest: U) => any,
  U extends any[]
>(
  f: T,
  ...args: U
) => new Promise<void>(res => f(res, ...args))

export const timeLimit = <T extends Promise<any>>(ms: number, ...proms: T[]) =>
  Promise.race<T>([...proms, new Promise((_, rej) => setTimeout(rej, ms))])

export const asyncCB =
  <T extends λ | undefined>(prom: Promise<T>) =>
  (
    ...args: T extends λ ? Parameters<T> : []
  ): T extends λ
    ? ReturnType<T> extends PromiseLike<any>
      ? ReturnType<T>
      : Promise<ReturnType<T>>
    : Promise<undefined> =>
    new Promise((res, rej) =>
      prom.then(f => res(f?.(...args))).catch(rej)
    ) as any

export const retry = async <T>(
  max: number,
  delay: number,
  attempt: () => T
): Promise<T extends Promise<infer I> ? I : T> => {
  try {
    return await (attempt as any)()
  } catch (err) {
    if (max <= 1) throw err
    logger.warn(`attempt failed, ${max - 1} attempts left`)
    await wait(setTimeout, delay)
    return await retry(max - 1, delay, attempt)
  }
}
