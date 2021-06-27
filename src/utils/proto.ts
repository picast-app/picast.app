export const bindThis = (target: any) => {
  for (const [key, { get, value }] of Object.entries(
    Object.getOwnPropertyDescriptors(Object.getPrototypeOf(target))
  ))
    if (!get && typeof value === 'function') target[key] = value.bind(target)
}

type Methods<
  T,
  KM extends keyof T = Exclude<FilterKeys<T, λ>, 'construct' | 'destruct'>
> = {
  [K in KM]: T[K]
}

export const methods = <T>(target: T): Methods<T> =>
  Object.fromEntries(
    Object.getOwnPropertyNames(Object.getPrototypeOf(target))
      .filter(
        n => typeof target[n as keyof T] === 'function' && n !== 'constructor'
      )
      .map(n => [n, (target as any)[n].bind(target)])
  ) as any
