import MainWorker from 'main/main.worker'
import type { API } from 'main/main.worker'
import { wrap, proxy, expose } from '@picast-app/fiber'
import { snack } from 'utils/notification'
import uiAPI from './uiThreadAPI'
import type { API as SWAPI } from 'sw'

export { proxy }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

const mainWorker: Worker = new (MainWorker as any)()
export const main = wrap<API>(mainWorker, process.env.NODE_ENV !== 'production')

export const serviceWorker = navigator.serviceWorker.ready.then(
  ({ active }) => {
    if (!active) return null
    const channel = new MessageChannel()
    active.postMessage({ type: 'UI_PORT', port: channel.port2 }, [
      channel.port2,
    ])
    // fixme: first exposing, then wrapping leads to error
    const sw = wrap<SWAPI>(channel.port1)
    expose(uiAPI, channel.port1)
    return sw
  }
)

Object.entries(uiAPI).forEach(([k, v]) => {
  main.registerUICall(k as any, proxy(v))
})

const interactions = ['mousewheel', 'keydown', 'pointerdown']

let hasInteracted = false

const onInteract = () => {
  hasInteracted = true
  interactions.forEach(name => window.removeEventListener(name, onInteract))
}

interactions.forEach(name => window.addEventListener(name, onInteract))

navigator.serviceWorker.onmessage = e => {
  if (e.data.type === 'UPDATE_AVAILABLE') {
    if (
      !hasInteracted &&
      Date.now() - performance.timing.navigationStart <= 2000
    )
      location.reload()
    else
      snack({
        text: 'There is an update available.',
        action: 'reload',
        actionEvent: 'echo_reload',
        timeout: 8,
      })
  }
}

//
;(window as any).idb = { get: main.idbGet, put: main.idbPut }
