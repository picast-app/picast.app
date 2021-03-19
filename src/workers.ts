import { wrap } from 'comlink'
import MainWorker from 'main/main.worker'
import createSub from 'utils/subscription'
import type { API } from 'main/main.worker'
import { proxy, createEndpoint } from 'comlink'
import { snack } from 'utils/notification'
import type { Podcast } from 'main/store/types'

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

export const subscriptionSub = createSub<Podcast[]>([])

main.state(
  'subscriptions',
  // @ts-ignore
  proxy((subs: Podcast[]) => {
    subscriptionSub.setState(subs)
  })
)

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
