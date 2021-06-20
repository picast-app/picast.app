import { main, proxy } from 'workers'
import type { threaded } from '.'
import type { FlatState } from './state'
import type { Setter } from './storeX'

type API = typeof threaded

export default {
  getX: (main.getX as unknown) as API['getX'],
  setX: (main.setX as unknown) as API['setX'],
  mergeX: (main.mergeX as unknown) as API['mergeX'],
  listenX: <T extends keyof FlatState>(
    k: T,
    cb: Setter<FlatState[T]>,
    ...subs: string[]
  ) => main.listenX(k, proxy(cb) as any, ...subs),
}
