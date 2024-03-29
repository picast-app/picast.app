import { querySub } from 'utils/css/query'
import { proxy } from '@picast-app/fiber'
import { history } from '@picast-app/router'

const api = {
  alert: (msg?: any) => {
    window.alert(msg)
  },
  readLocalStorage: (key: string) => localStorage.getItem(key),
  writeLocalStorage(key: string, value?: string) {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  },
  matchMedia(query: string) {
    const sub = querySub(query)
    return proxy((cb: (v: boolean) => any) => {
      sub.subscribe(cb)
      cb(sub.state)
    })
  },
  addEventListener<T extends keyof WindowEventMap>(
    event: T,
    handler: λ<[WindowEventMap[T]]>
  ) {
    window.addEventListener(event, handler)
  },
  navigate: (target: Parameters<typeof history['push']>[0]) => {
    history.push(target)
  },
}
export type API = typeof api
export default api
