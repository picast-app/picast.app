export type Case = 'camel'

export const capitalize = <T extends string>(str: T) =>
  (str[0].toUpperCase() + str.slice(1)) as Capitalize<T>

export type Prefix<
  T extends string,
  P extends string,
  C extends Case | void = void
> = `${P}${C extends 'camel' ? Capitalize<T> : T}`

export const prefix = <
  T0 extends string,
  T1 extends string,
  C extends Case | void = void
>(
  prefix: T0,
  str: T1,
  caseMod?: C
): Prefix<T1, T0, C> =>
  `${prefix}${caseMod === 'camel' ? capitalize(str) : str}` as any
