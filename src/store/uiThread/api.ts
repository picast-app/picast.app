import { main } from 'workers'
import type { threaded } from 'store'
import { listen } from './registry'

type API = typeof threaded

const api = {
  getX: (main.getX as unknown) as API['getX'],
  setX: (main.setX as unknown) as API['setX'],
  mergeX: (main.mergeX as unknown) as API['mergeX'],
  listenX: listen,
}
export default api
;(globalThis as any).storeX = api
