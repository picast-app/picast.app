import * as path from 'utils/path'

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
  public get<K extends keyof TF & string>(key: K): TF[K] {
    for (const [k, f] of this.handlers)
      if (key.startsWith(k)) return this.pick(f(), k, key)
    throw Error(`no get handler for '${key}' registered`)
  }

  // handler map in reverse alphabetical order
  private handlers: [string, any][] = []

  public addHandler<K extends keyof TF & string>(key: K, handler: () => TF[K]) {
    const i = this.handlers.findIndex(([k]) => k < key)
    if (i < 0) this.handlers.push([key, handler])
    else this.handlers.splice(i, 0, [key, handler])
  }

  private pick(obj: any, root: string, select: string) {
    if (root === select) return obj
    const value = path.pick(obj, ...select.slice(root.length + 1).split('.'))
    if (value === path.none)
      throw Error(`path '${root}' does not contain '${select}'`)
    return value
  }
}
