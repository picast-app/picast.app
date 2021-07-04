import { oneOf } from 'utils/equal'
import { bound } from 'utils/function'
import { pick } from 'utils/object'

const isFiberMsg = <T extends 'request' | 'response'>(
  msg: unknown
): msg is T extends 'request' ? FiberRequest : FiberReponse =>
  !!msg && typeof msg === 'object' && '__fid' in msg!

const isError = (
  v: unknown,
  b?: boolean
): v is Pick<Error, 'message' | 'name' | 'stack'> => !!b

const genId = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

export function expose<T>(api: T, endpoint: Endpoint = self as any) {
  const select = (node: any, path: string[]): any =>
    !path.length ? node : select(node[path[0]], path.slice(1))

  self.addEventListener('message', e => {
    if (!isFiberMsg<'request'>(e.data)) return

    let data: any
    let isError = false
    try {
      data = select(api, e.data.path)
    } catch (e) {
      data = pick(e instanceof Error ? e : Error(e), 'message', 'name', 'stack')
      isError = true
    }

    const response: FiberReponse = { __fid: e.data.__fid, data, isError }
    endpoint.postMessage(response)
  })
}

const proxy = (
  send: (msg: Omit<FiberRequest, '__fid'>) => Promise<any>,
  ...path: string[]
): any =>
  new Proxy(
    {},
    {
      get(_, p) {
        if (typeof p === 'symbol')
          throw Error(`can't access symbol ${String(p)}`)

        if (oneOf(p, ...(['then', 'catch', 'finally'] as const)))
          return bound(send({ type: 'GET', path }), p)

        return proxy(send, ...path, p)
      },
    }
  )

export function wrap<T>(endpoint: Endpoint): Wrapped<T> {
  const pending: Record<number, [res: λ, rej: λ]> = {}

  endpoint.addEventListener('message', e => {
    const res = (e as any).data
    if (!isFiberMsg<'response'>(res)) return
    if (!(res.__fid in pending)) return
    const [resolve, reject] = pending[res.__fid]
    delete pending[res.__fid]
    if (!isError(res.data, res.isError)) return resolve(res.data)
    const err = new Error(res.data.message)
    err.name = res.data.name
    if (err.stack && res.data.stack) {
      const stack = res.data.stack.split('\n')
      while (/^\w*Error:/.test(stack[0])) stack.shift()
      err.stack = `${err.stack}\n${stack.join('\n')}`
    }
    reject(err)
  })

  const send = (msg: Omit<FiberRequest, '__fid'>): Promise<any> => {
    const __fid = genId()
    endpoint.postMessage({ __fid, ...msg })
    return new Promise((res, rej) => (pending[__fid] = [res, rej]))
  }

  return proxy(send)
}

interface Endpoint {
  postMessage(message: any, transfer?: Transferable[]): void
  addEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
  removeEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
}

type FiberRequest = { __fid: number; type: 'GET'; path: string[] }
type FiberReponse = { __fid: number; data: unknown; isError?: boolean }

type Wrapped<T> = T extends λ<infer TA, infer TR>
  ? (...args: TA) => TR extends PromiseLike<any> ? TR : Promise<TR>
  : Promise<T> & { [K in keyof T]: Wrapped<T[K]> }
