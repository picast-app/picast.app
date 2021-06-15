export type Schema = { [K: string]: Primitive | Primitive[] | Schema }

type Stringified<T extends string | number | symbol> = T extends symbol
  ? '[sym]'
  : T

export type Prefix<T, P extends string> = {
  [K in keyof Required<T>]: { [S in `${P}${Stringified<K>}`]: T[K] }
}[keyof T]

export type _Flatten<T, P extends string> = T extends Schema
  ? Prefix<T, P> &
      { [K in keyof T]: _Flatten<T[K], `${P}${Stringified<K>}.`> }[keyof T]
  : {}

export type Flatten<T> = UnionToIntersection<_Flatten<T, ''>>
