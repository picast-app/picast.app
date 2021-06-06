import type { API } from 'uiThreadAPI'

const calls: Partial<API> = {}

const callCache: { [K in keyof API]?: any[] } = {}

const uiCalls = new Proxy(calls, {
  get(_, key: keyof API) {
    return (calls[key] ??= (...args: any[]) => {
      callCache[key] ??= []
      callCache[key]?.push(args)
    })
  },
}) as API
export default uiCalls

export const registerUICall = <T extends keyof API>(name: T, call: API[T]) => {
  uiCalls[name] = call
  for (const args of callCache[name] ?? []) call(...args)
}
