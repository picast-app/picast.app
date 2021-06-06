import MemCache, { _, OptPrim } from './memCache'
import dbProm from 'main/store/idb'
import type { Schema } from '.'
import equal from 'utils/equal'
import { pick } from 'utils/object'

type IDBMeta = {
  printLogs: boolean
  showTouchPaths: boolean
}

export default class Settings extends MemCache<Schema['settings']> {
  root = 'settings'
  state: OptPrim<Schema['settings']> = {
    appearance: {
      colorTheme: _,
      useSystemTheme: _,
    },
    debug: {
      printLogs: _,
      showTouchPaths: _,
      playbackLoading: false,
    },
  }

  async init() {
    this.state.appearance.colorTheme = 'light'
    this.state.appearance.useSystemTheme = false
    const idb = await this.idbCompleteDefault(await this.readIDB())
    Object.assign(this.state.debug, pick(idb, 'printLogs', 'showTouchPaths'))
  }

  private async readIDB(): Promise<Partial<IDBMeta>> {
    const idb = await dbProm
    const tx = idb.transaction('meta', 'readonly')
    const res = await Promise.all([
      ...Settings.IDBKeys.map(key => tx.store.get(key).then(v => [key, v])),
      tx.done,
    ] as Promise<any>[])
    return Object.fromEntries(res.slice(0, -1))
  }

  private async idbCompleteDefault(idb: Partial<IDBMeta>): Promise<IDBMeta> {
    const state = { ...idb }

    state.printLogs ??= process.env.NODE_ENV !== 'production'
    state.showTouchPaths ??= false

    if (!equal(state, idb)) {
      const db = await dbProm
      const tx = db.transaction('meta', 'readwrite')
      for (const [k, v] of Object.entries(state)) {
        if (v === (idb as any)[k]) continue
        logger.info('default meta', k, v)
        tx.store.put(v, k)
      }
      await tx.done
    }

    return state as IDBMeta
  }

  private static IDBKeys = ['printLogs', 'showTouchPaths']
}
