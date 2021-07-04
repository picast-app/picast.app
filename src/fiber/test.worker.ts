import { expose } from './fiber'

// declare const self: DedicatedWorkerGlobalScope
export default null

const api = {
  count: 0,
  incr() {
    return ++this.count
  },
  fetch() {
    return new Promise<string>(res => res('foo'))
  },
  nested: {
    foo: {
      bar: 'baz',
    },
  },
}
export type API = typeof api

expose(api)
