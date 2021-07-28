import { main, proxy } from 'app/workers'
import { Key, Value } from 'app/store/state'
import { forEach } from 'app/utils/object'
if (globalThis !== window) throw Error()

registerHooks({
  'settings.appearance.colorTheme': async theme => {
    document.documentElement.dataset.theme = theme
    if (!(await main.getX('settings.appearance.useSystemTheme')))
      localStorage.setItem('custom-theme', theme)
  },

  'settings.appearance.useSystemTheme': async v => {
    if (v) localStorage.removeItem('custom-theme')
    else
      localStorage.setItem(
        'custom-theme',
        (await main.getX('settings.appearance.colorTheme')) as any
      )
  },
})

function registerHooks(hooks: { [K in Key]?: (v: Value<K>) => any }) {
  forEach(hooks, (k, effect) => {
    main.listenX(
      k,
      proxy((v, path: string) => {
        // @ts-ignore
        if (path === k) effect(v)
      })
    )
  })
}
