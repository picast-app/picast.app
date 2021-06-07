import MemCache, { _, OptPrim, HookDict } from './memCache'
import dbProm from 'main/store/idb'
import equal from 'utils/equal'
import { pick } from 'utils/object'
import type { State } from './state'
import uiThread from 'main/ui'
import type { Store } from '.'
import { proxy } from 'comlink'
import { idbWriter } from './util'

type IDBMeta = {
  printLogs: boolean
  showTouchPaths: boolean
  extractColor: boolean
}

const IDBKeys = ['printLogs', 'showTouchPaths', 'extractColor'] as const
type Key = typeof IDBKeys[number]

export default class Settings extends MemCache<State['settings']> {
  sync = 'settings'
  root = 'settings'
  state: OptPrim<State['settings']> = {
    appearance: {
      colorTheme: _,
      useSystemTheme: _,
      extractColor: false,
    },
    debug: {
      printLogs: _,
      showTouchPaths: _,
      playbackLoading: false,
    },
  }

  hooks: HookDict<State['settings']> = {
    'debug.printLogs': idbWriter<Key>('printLogs'),
    'debug.showTouchPaths': idbWriter<Key>('showTouchPaths'),
    'appearance.extractColor': idbWriter<Key>('extractColor'),
    'appearance.useSystemTheme': v => {
      if (v) this.store.set('settings.appearance.colorTheme', this.sysTheme)
    },
  }

  private sysTheme: State['settings']['appearance']['colorTheme'] = 'light'

  constructor(protected readonly store: Store) {
    super(store)
    this.listenSystemTheme()
  }

  async init() {
    const idbInit = async () => {
      const idb = await this.idbCompleteDefault(await this.readIDB())
      Object.assign(this.state.debug, pick(idb, 'printLogs', 'showTouchPaths'))
      Object.assign(this.state.appearance, pick(idb, 'extractColor'))
    }

    const uiInit = async () => {
      const cst = await uiThread.readLocalStorage('custom-theme')
      this.state.appearance.useSystemTheme = !cst
      this.state.appearance.colorTheme = cst ?? (this.sysTheme as any)
    }

    await Promise.all([idbInit(), uiInit()])
  }

  private async readIDB(): Promise<Partial<IDBMeta>> {
    const idb = await dbProm
    const tx = idb.transaction('meta', 'readonly')
    const res = await Promise.all([
      ...IDBKeys.map(key => tx.store.get(key).then(v => [key, v])),
      tx.done,
    ] as Promise<any>[])
    return Object.fromEntries(res.slice(0, -1))
  }

  private async idbCompleteDefault(idb: Partial<IDBMeta>): Promise<IDBMeta> {
    const state = { ...idb }

    state.printLogs ??= process.env.NODE_ENV !== 'production'
    state.showTouchPaths ??= false
    state.extractColor ??= false

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

  private async listenSystemTheme() {
    const onChange = await uiThread.matchMedia('(prefers-color-scheme: dark)')
    onChange(
      proxy((isDark: boolean) => {
        this.sysTheme = isDark ? 'dark' : 'light'
        if (this.state.appearance.useSystemTheme)
          this.store.set('settings.appearance.colorTheme', this.sysTheme)
      })
    )
  }
}
