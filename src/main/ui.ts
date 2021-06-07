import type { API } from 'uiThreadAPI'

type Promisify<T> = T extends PromiseLike<infer I> ? Promise<I> : Promise<T>
type MapProm<T extends { [K: string]: (...args: any[]) => any }> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promisify<ReturnType<T[K]>>
}

const calls: Partial<MapProm<API>> = {}

type CachedCall = [res: (v: any) => any, args: any[]]
const callCache: { [K in keyof API]?: CachedCall[] } = {}

const uiCalls = (new Proxy(calls, {
  get(_, key: keyof API) {
    return (calls[key] ??= (...args: any[]) =>
      new Promise<any>(res => {
        callCache[key] ??= []
        callCache[key]?.push([res, args])
      }))
  },
}) as unknown) as MapProm<API>
export default uiCalls

export const registerUICall = <T extends keyof API>(name: T, call: API[T]) => {
  uiCalls[name] = call as any
  for (const [res, args] of callCache[name] ?? [])
    (call as any)(...args).then(res)
}
