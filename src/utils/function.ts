export * from 'snatchblock/function'

export const bound = <T, K extends FilterKeys<T, λ>>(obj: T, method: K): T[K] =>
  (obj[method] as any).bind(obj)

export const chain =
  <F1 extends λ, F2 extends λ<[F1, ReturnType<F1>, ...Parameters<F1>]>>(
    f1: F1,
    f2: F2
  ) =>
  (...args: Parameters<F1>): ReturnType<F2> =>
    f2(f1, f1(...args), ...args)
