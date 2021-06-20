import { wrap, proxy, createEndpoint } from 'comlink'
import MainWorker from 'main/main.worker'
import type { API } from 'main/main.worker'
import { snack } from 'utils/notification'
import uiAPI from './uiThreadAPI'

export { proxy }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

const mainWorker: Worker = new (MainWorker as any)()
export const main = wrap<API>(mainWorker)

async function init() {
  const [{ active }, port] = await Promise.all([
    navigator.serviceWorker.ready,
    main[createEndpoint](),
  ])

  if (!active) return

  active!.postMessage({ type: 'MAIN_WORKER_PORT', port }, [port])
}
init()

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
