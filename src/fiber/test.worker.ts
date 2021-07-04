import { expose } from './fiber'

// declare const self: DedicatedWorkerGlobalScope
export default null

const api = {
  count: 0,
  incr() {
    return ++this.count
  },
  async promStr(err = false): Promise<string> {
    return err ? Promise.reject('error') : Promise.resolve('success')
  },
  nested: {
    foo: {
      bar: 'baz',
    },
  },
  add: (a: number, b: number) => a + b,
  sum: (...ns: number[]) => ns.reduce((a, c) => a + c),
  async callCB(cb: (msg: string) => Promise<string>) {
    const answer = await cb('hello from worker')
    console.log({ answer })
    return { answer }
  },
}
export type API = typeof api

expose(api)
