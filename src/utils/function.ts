import { isPromise } from 'app/utils/promise'

export const callAll = <T extends any[] = []>(
  list?: (((...args: T) => any) | undefined)[],
  ...args: T
) => list?.map(cb => cb?.(...args)) ?? []

export const ident = <T>(v: T): T => v

export const bundle =
  <TA extends any[]>(...funcs: (((...args: TA) => any) | undefined)[]) =>
  async (...args: TA): Promise<void> => {
    const res = funcs.map(func => func?.(...args))
    if (res.some(isPromise)) await Promise.all(res)
  }

export const bundleSync =
  <TA extends any[]>(...funcs: (((...args: TA) => any) | undefined)[]) =>
  (...args: TA) =>
    void callAll(funcs, ...args)

export const forward =
  <T extends λ, P extends any[]>(func: T, ...argsR: P) =>
  (
    ...argsL: Parameters<T> extends [...infer PR, ...P] ? PR : never
  ): ReturnType<T> =>
    func(...argsL, ...argsR)

export const nullChain =
  <T extends λ>(...[func, ...rest]: T[]) =>
  (...args: Parameters<T>): ReturnType<T> | undefined =>
    !func ? undefined : func(...args) ?? nullChain(...rest)(...args)

export const asyncNullChain =
  <T extends λ, TL extends MaybeAsync<T>>(
    ...[func, ...rest]: [T, ...MaybeAsync<T>[], TL]
  ) =>
  async (...args: Parameters<T>): Promise<PromType<ReturnType<TL>>> =>
    !func
      ? null
      : (await func(...args)) ??
        (await asyncNullChain(...(rest as [any, ...any[], any]))(...args))

type MaybeAsync<T extends λ> = (
  ...args: Parameters<T>
) => MaybeProm<ReturnType<T>>

export const bound = <T, K extends FilterKeys<T, λ>>(obj: T, method: K): T[K] =>
  (obj[method] as any).bind(obj)

export const chain =
  <F1 extends λ, F2 extends λ<[F1, ReturnType<F1>, ...Parameters<F1>]>>(
    f1: F1,
    f2: F2
  ) =>
  (...args: Parameters<F1>): ReturnType<F2> =>
    f2(f1, f1(...args), ...args)

export const debounce = <T extends λ<TA>, TA extends any[]>(
  f: T,
  ms: number
): λ<TA, void> => {
  let toId: any
  return (...args: TA) => {
    clearTimeout(toId)
    toId = setTimeout(() => f(...args), ms)
  }
}

export const throttle = <T extends λ<TA>, TA extends any[]>(
  func: T,
  ms: number,
  {
    leading = true,
    trailing = true,
  }: { leading?: boolean; trailing?: boolean } = {}
): λ<TA, void> => {
  let toId: any
  let lastInvoke = -Infinity
  let lastArgs: TA | undefined

  const invoke = () => {
    lastInvoke = performance.now()
    toId = undefined
    func(...lastArgs!)
  }

  return (...args: TA) => {
    if (!leading && !trailing) return
    lastArgs = args
    const dt = performance.now() - lastInvoke

    if ((leading && lastInvoke === null) || dt >= ms) invoke()
    else if (toId === undefined) toId = setTimeout(invoke, ms - dt)
  }
}
