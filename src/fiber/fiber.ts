import { oneOf } from 'utils/equal'
import { bound } from 'utils/function'

const isFiberMsg = <T extends 'request' | 'response'>(
  msg: unknown
): msg is T extends 'request' ? FiberRequest : FiberReponse =>
  !!msg && typeof msg === 'object' && '__fid' in msg!

const genId = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

export function expose<T>(api: T, endpoint: Endpoint = self as any) {
  const select = (node: any, path: string[]): any =>
    !path.length ? node : select(node[path[0]], path.slice(1))

  self.addEventListener('message', e => {
    if (!isFiberMsg<'request'>(e.data)) return

    const selected = select(api, e.data.path)

    const response: FiberReponse = { __fid: e.data.__fid, data: selected }
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
    const data = (e as any).data
    if (!isFiberMsg<'response'>(data)) return
    logger.info('got back', data)
    if (!(data.__fid in pending)) return
    const [res, rej] = pending[data.__fid]
    delete pending[data.__fid]
    res(data.data)
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
type FiberReponse = { __fid: number; data: unknown }

type Wrapped<T> = T extends λ<infer TA, infer TR>
  ? (...args: TA) => TR extends PromiseLike<any> ? TR : Promise<TR>
  : Promise<T> & { [K in keyof T]: Wrapped<T[K]> }
