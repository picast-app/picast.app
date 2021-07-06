import { oneOf } from 'utils/equal'
import { bound } from 'utils/function'
import { mapValues, pick } from 'utils/object'
import { isFiberMsg, isError, genId, select } from './util'
import {
  FiberResponse,
  FiberRequest,
  Wrapped,
  Proxied,
  Endpoint,
  proxied,
  release,
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
    if (msg.args) msg.args = msg.args.map(pack, false)
    endpoint.postMessage({ __fid, ...msg })
    return new Promise((res, rej) => (pending[__fid] = [res, rej]))
  }

  const proxyRefs: Record<number, any> = {}

  const pack = (arg: any): any => {
    if (!oneOf(typeof arg, 'object', 'function') || arg === null) return arg
    if (!(proxied in arg)) {
      if (typeof arg === 'function') proxy(arg, false)
      else return Array.isArray(arg) ? arg.map(pack) : mapValues(arg, pack)
    }

    if (!(arg[proxied] in proxyMap)) {
      proxyMap[arg[proxied]] = new WeakRef(arg)
      registry.register(arg, arg[proxied])
      if (release in arg && !arg[release]) {
        proxyRefs[arg[proxied]] = arg
        arg[release] = () => {
          delete proxyRefs[arg[release]]
          arg[release] = undefined
        }
      }
      if (debug) proxyStrs[arg[proxied]] = String(arg)
    }

    return { __proxy: arg[proxied] }
  }

  const unpack = (arg: any): any => {
    if (typeof arg !== 'object' || arg === null) return arg
    if ('__proxy' in arg) return createProxy(send, arg.__proxy)
    return Array.isArray(arg) ? arg.map(unpack) : mapValues(arg, unpack)
  }

  endpoint.addEventListener('message', async e => {
    const msg = (e as any).data
    if (!isFiberMsg(msg)) return
    // todo: investigate scope behavior of proxied return
    if ('type' in msg) {
      const res = await handleRequest(msg)
      endpoint.postMessage(pack(res))
    } else handleResponse(msg)
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
          `tried to access unreferenced proxy ${msg.path[0]}` +
            (!debug || !(msg.path[0] in proxyStrs)
              ? ''
              : `\n\n${proxyStrs[msg.path[0] as number].replace(
                  /(^|\n)/g,
                  '$1| '
                )}\n`)
        )

      if (msg.type === 'GET') data = node
      else data = await node.call(ctx, ...(msg.args?.map(unpack) ?? []))
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
    if (!isError(msg.data, msg.isError)) return resolve(unpack(msg.data))
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
        return typeof path.slice(-1)[0] === 'string'
          ? bound(send({ type: 'GET', path }), p)
          : undefined

      return createProxy(send, ...path, p)
    },
    apply: (_, __, args) => send({ type: 'INV', path, args }),
  })

export const proxy = <T extends Record<any, any>>(
  value: T,
  keepRef = true
): Proxied<T> =>
  proxied in value
    ? value
    : (Object.assign(value, {
        [proxied]: genId(),
        ...(keepRef && { [release]: undefined }),
      }) as any)

const debug = process.env.NODE_ENV === 'development'
const proxyStrs: Record<number, string> = {}
