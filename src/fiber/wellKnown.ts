export const proxied = Symbol('proxied')

export type FiberRequest = {
  __fid: number
  type: 'GET' | 'INV'
  path: (string | number)[]
  args?: any[]
}
export type FiberResponse = { __fid: number; data: unknown; isError?: boolean }

export type ProxyKey = { __proxy: number }

export type Wrapped<T> = T extends λ<infer TA, infer TR>
  ? (...args: ProxyArgs<TA>) => TR extends PromiseLike<any> ? TR : Promise<TR>
  : Promise<T> & { [K in keyof T]: Wrapped<T[K]> }

type ProxyArgs<T extends any[]> = {
  [K in keyof T]: T[K] extends λ<infer TA, infer TR>
    ? (...args: TA) => TR extends PromiseLike<infer U> ? U | TR : TR
    : T[K]
}

export interface Endpoint {
  postMessage(message: any, transfer?: Transferable[]): void
  addEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
  removeEventListener: λ<[string, EventListenerOrEventListenerObject, any?]>
}
