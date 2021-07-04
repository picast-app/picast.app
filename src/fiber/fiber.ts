export function expose<T>(api: T, endpoint: Endpoint = self as any) {
  self.addEventListener('message', e => {
    if (!e.data || typeof e.data !== 'object' || !('__f' in e.data)) return
    console.log('received', e.data)

    endpoint.postMessage('response')
  })
}

const proxy = (send: (msg: Serialized) => void, ...path: string[]): any =>
  new Proxy(
    {},
    {
      get(_, p) {
        if (typeof p === 'symbol')
          throw Error(`can't access symbol ${String(p)}`)

        if (p === 'then') {
          send({ type: 'GET', path })
          return
        }
        return proxy(send, ...path, p)
      },
    }
  )

export function wrap<T>(endpoint: Endpoint): Wrapped<T> {
  endpoint.addEventListener('message', e => {
    logger.info('got back', e)
  })

  const send = (msg: Serialized) => {
    endpoint.postMessage({ __f: 0, ...msg })
  }

  return proxy(send)
}

interface Endpoint {
  postMessage(message: any, transfer?: Transferable[]): void
  addEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
  removeEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
}

type Serialized = { type: 'GET'; path: string[] }

type Wrapped<T> = T extends λ<infer TA, infer TR>
  ? (...args: TA) => TR extends PromiseLike<any> ? TR : Promise<TR>
  : Promise<T> & { [K in keyof T]: Wrapped<T[K]> }
