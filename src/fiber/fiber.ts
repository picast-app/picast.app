import { oneOf } from 'utils/equal'
import { bound } from 'utils/function'
import { mapValues, pick } from 'utils/object'
import { isFiberMsg, isError, genId, select } from './util'
import {
  FiberResponse,
  FiberRequest,
  Wrapped,
  Endpoint,
  proxied,
} from './wellKnown'

export const wrap = <T>(endpoint: Endpoint): Wrapped<T> =>
  expose(undefined, endpoint)

export function expose<T>(api: T, endpoint: Endpoint = self): Wrapped<T> {
  const pending: Record<number, [res: λ, rej: λ]> = {}
  const proxyMap: Record<number, WeakRef<any>> = {}
  const registry = new FinalizationRegistry((id: number) => {
    delete proxyMap[id]
  })

  const send = (msg: any) => {
    const __fid = genId()
    if (msg.args) msg.args = msg.args.map(packArg)
    endpoint.postMessage({ __fid, ...msg })
    return new Promise((res, rej) => (pending[__fid] = [res, rej]))
  }

  const packArg = (arg: any): any => {
    if (!oneOf(typeof arg, 'object', 'function') || arg === null) return arg
    if (!(proxied in arg)) {
      if (typeof arg === 'function') proxy(arg)
      else return mapValues(arg, packArg)
    }
    proxyMap[arg[proxied]] ??=
      (registry.register(arg, arg[proxied]), new WeakRef(arg))
    return { __proxy: arg[proxied] }
  }

  const unpackArg = (arg: any): any => {
    if (typeof arg !== 'object' || arg === null) return arg
    if ('__proxy' in arg) return createProxy(send, arg.__proxy)
    return mapValues(arg, unpackArg)
  }

  endpoint.addEventListener('message', async e => {
    const msg = (e as any).data
    if (!isFiberMsg(msg)) return
    if ('type' in msg) endpoint.postMessage(await handleRequest(msg))
    else handleResponse(msg)
  })

  async function handleRequest(msg: FiberRequest): Promise<FiberResponse> {
    let data: any
    let isError = false

    try {
      const isRoot = msg.path.length === 0
      const root = typeof msg.path[0] === 'number' ? proxyMap : api
      const ctx = isRoot ? undefined : select(root, msg.path.slice(0, -1))
      let node = isRoot ? api : select(ctx, msg.path.slice(-1))
      if (
        (root === proxyMap && node === undefined) ||
        (node instanceof WeakRef && (node = node.deref()) === undefined)
      )
        throw new ReferenceError(
          `tried to access unreferenced proxy ${msg.path[0]}`
        )

      if (msg.type === 'GET') data = node
      else data = await node.call(ctx, ...(msg.args?.map(unpackArg) ?? []))
    } catch (e) {
      data = pick(e instanceof Error ? e : Error(e), 'message', 'name', 'stack')
      isError = true
    }

    return { __fid: msg.__fid, data, isError }
  }

  function handleResponse(msg: FiberResponse) {
    if (!(msg.__fid in pending)) return
    const [resolve, reject] = pending[msg.__fid]
    delete pending[msg.__fid]
    if (!isError(msg.data, msg.isError)) return resolve(msg.data)
    const err = new Error(msg.data.message)
    err.name = msg.data.name
    if (err.stack && msg.data.stack) {
      const stack = msg.data.stack.split('\n')
      while (/^\w*Error:/.test(stack[0])) stack.shift()
      err.stack = `${err.stack}\n${stack.join('\n')}`
    }
    reject(err)
  }

  return createProxy(send)
}

const createProxy = (
  send: (msg: Omit<FiberRequest, '__fid'>) => Promise<any>,
  ...path: (string | number)[]
): any =>
  new Proxy(() => {}, {
    get(_, p) {
      if (typeof p === 'symbol') throw Error(`can't access symbol ${String(p)}`)

      if (oneOf(p, ...(['then', 'catch', 'finally'] as const)))
        return bound(send({ type: 'GET', path }), p)

      return createProxy(send, ...path, p)
    },
    apply: (_, __, args) => send({ type: 'INV', path, args }),
  })

export const proxy = <T extends Record<any, any>>(
  value: T
): T & { [proxied]: number } =>
  proxied in value
    ? value
    : (Object.assign(value, { [proxied]: genId() }) as any)
