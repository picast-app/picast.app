import { wrap, proxy } from 'comlink'
import MainWorker from 'main/main.worker'
import { ChannelManager, msg } from 'utils/msgChannel'
import createSub from 'utils/subscription'

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

const mainWorker: Worker = new (MainWorker as any)()
export const main = wrap<MainAPI>(mainWorker)

navigator.serviceWorker.ready.then(({ active }) => {
  if (!active) return
  const { port1, port2 } = new MessageChannel()

  mainWorker.postMessage(
    msg('ADD_MSG_CHANNEL', { target: 'service', port: port1 }),
    [port1]
  )
  active.postMessage(msg('ADD_MSG_CHANNEL', { target: 'main', port: port2 }), [
    port2,
  ])
})

export const channels = new ChannelManager('ui')

{
  const { port1, port2 } = new MessageChannel()
  channels.addChannel('main', port1)
  mainWorker.postMessage(
    msg('ADD_MSG_CHANNEL', { target: 'ui', port: port2 }),
    [port2]
  )
}

export const subscriptionSub = createSub<string[]>()

main
  .subscriptions(
    proxy(({ added, removed }) => {
      if (removed?.length)
        subscriptionSub.setState(
          subscriptionSub.state.filter(id => !removed.includes(id))
        )
      if (
        added?.length &&
        added.some(id => !subscriptionSub.state.includes(id))
      )
        subscriptionSub.setState(
          Array.from(new Set([...subscriptionSub.state, ...added]))
        )
    })
  )
  .then(subscriptions => {
    subscriptionSub.setState(subscriptions)
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
      window.dispatchEvent(
        new CustomEvent<EchoSnackEvent['detail']>('echo_snack', {
          detail: {
            text: 'There is an update available.',
            action: 'reload',
            actionEvent: 'echo_reload',
            timeout: 8,
          },
        })
      )
  }
}
