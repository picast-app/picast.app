type Schema = { [K: string]: Schema | string | number | boolean }

type Prefix<T, P extends string> = {
  [K in keyof T]: K extends string ? { [S in `${P}.${K}`]: T[K] } : never
}[keyof T]

type FlatSchema<T> = T extends Schema
  ? T &
      MergeDistr<
        {
          [K in keyof T]: K extends string ? Prefix<FlatSchema<T[K]>, K> : never
        }[keyof T]
      >
  : never

export default class Store<T extends Schema, TF = FlatSchema<T>> {
  public get<K extends keyof TF>(key: K): TF[K] {
    return 0 as any
  }

  public set<K extends keyof TF>(key: K, value: TF[K]) {}
}
