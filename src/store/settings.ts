import MemCache, { _, OptPrim, HookDict } from './memCache'
import { pick } from 'utils/object'
import type { State } from './state'
import type { Store } from '.'
import uiThread from 'main/ui'
import { proxy } from 'comlink'
import { idbWriter, idbDefaultReader } from './util'
import { bundle } from 'utils/function'
import { togglePrint } from 'utils/logger'

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
    'debug.printLogs': bundle(idbWriter<Key>('printLogs'), togglePrint),
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
      const idb = await idbDefaultReader(IDBKeys, {
        printLogs: process.env.NODE_ENV !== 'production',
        showTouchPaths: false,
        extractColor: false,
      })
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
