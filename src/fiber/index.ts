import { oneOf } from 'utils/equal'
import { bound } from 'utils/function'
import { mapValues, pick } from 'utils/object'
import { unzipWith } from 'utils/array'
import { isFiberMsg, isError, genId, select } from './util'
import {
  FiberResponse,
  FiberRequest,
  Wrapped as _Wrapped,
  Proxied,
  Endpoint,
  proxied,
  release,
  transfer as symTransfer,
} from './wellKnown'
export * from './wellKnown'

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
    const transfer: Transferable[] = []
    if (msg.args)
      msg.args = unzipWith(
        (msg.args as any[]).map(pack),
        (c, a = []) => [...a, c],
        v => transfer.push(...v)
      )[0]
    endpoint.postMessage({ __fid, ...msg }, transfer)
    return new Promise((res, rej) => (pending[__fid] = [res, rej]))
  }

  const proxyRefs: Record<number, any> = {}

  const pack = (arg: any): [arg: any, transfer: Transferable[]] => {
    if (!oneOf(typeof arg, 'object', 'function') || arg === null)
      return [arg, []]
    if (!(proxied in arg)) {
      if (typeof arg === 'function') proxy(arg, false)
      else {
        if (symTransfer in arg) return [arg, [arg as any]]

        if (!Array.isArray(arg)) {
          const transfers: Transferable[] = []
          return [
            mapValues(arg, v => {
              const [p, t] = pack(v)
              transfers.push(...t)
              return p
            }),
            transfers,
          ]
        }

        return arg.length
          ? unzipWith(
              arg.map(pack),
              (v, a = []) => [...a, v],
              (v, a: Transferable[] = []) => [...a, ...v]
            )
          : [[], []]
      }
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

    return [{ __proxy: arg[proxied] }, []]
  }

  const unpack = (arg: any): any => {
    if (typeof arg !== 'object' || arg === null) return arg
    if ('__proxy' in arg) return createProxy(send, arg.__proxy)
    return Array.isArray(arg)
      ? arg.map(unpack)
      : arg.constructor === Object
      ? mapValues(arg, unpack)
      : arg
  }

  endpoint.onmessage = async e => {
    const msg = (e as any).data
    if (!isFiberMsg(msg)) return
    // todo: investigate scope behavior of proxied return
    if ('type' in msg) {
      const res = await handleRequest(msg)
      const [data, transfer] = pack(res.data)
      res.data = data
      endpoint.postMessage(res, transfer)
    } else handleResponse(msg)
  }

  async function handleRequest(msg: FiberRequest): Promise<FiberResponse> {
    let data: any
    let isError = false

    try {
      if (msg.path.length === 1 && msg.path[0] in internal) {
        data = internal[msg.path[0] as keyof typeof internal](api)()
      } else {
        const isRoot = msg.path.length === 0
        const root = typeof msg.path[0] === 'number' ? proxyMap : api
        const ctx = isRoot ? undefined : select(root, msg.path.slice(0, -1))
        let node = isRoot ? api : await select(ctx, msg.path.slice(-1))
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
      }
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

const internal = {
  createPort: (api: any) => () => {
    const channel = new MessageChannel()
    expose(api, channel.port1)
    return transfer(channel.port2)
  },
}
type Internal = { [K in keyof typeof internal]: ReturnType<typeof internal[K]> }

type Wrapped<T> = _Wrapped<T & Internal>

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

export const transfer = <T>(v: T): T & { [symTransfer]: true } =>
  Object.assign(v, { [symTransfer]: true } as any)

const debug = process.env.NODE_ENV === 'development'
const proxyStrs: Record<number, string> = {}
