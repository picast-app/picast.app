import Store, { FlatSchema } from './storeX'

export type Schema = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
      extractColor: boolean
    }
  }
}
type Flat = FlatSchema<Schema>
export type Key = keyof Flat
export type Value<T extends Key> = Flat[T]

export const store = new Store<Schema>()

export const threaded = {
  listenX<T extends keyof Flat>(key: T, cb: (v: Value<T>) => any) {
    cb(store.get(key))
    store.handler(key).set(cb)
  },
}
