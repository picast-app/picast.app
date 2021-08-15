import { querySub } from 'utils/css/query'
import { proxy } from '@picast-app/fiber'

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
}
export type API = typeof api
export default api
