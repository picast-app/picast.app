import { isPromise } from 'utils/promise'

export const callAll = <T extends any[] = []>(
  list?: (((...args: T) => any) | undefined)[],
  ...args: T
) => {
  for (const cb of list ?? []) cb?.(...args)
}

export const ident = <T>(v: T): T => v

export const bundle =
  <TA extends any[]>(...funcs: ((...args: TA) => any)[]) =>
  async (...args: TA): Promise<void> => {
    const res = funcs.map(func => func(...args))
    if (res.some(isPromise)) await Promise.all(res)
  }

export const bundleSync =
  <TA extends any[]>(...funcs: (((...args: TA) => any) | undefined)[]) =>
  (...args: TA) =>
    callAll(funcs, ...args)

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
