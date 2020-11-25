import { wrap } from 'comlink'
import MainWorker from 'main/main.worker'
import { msg } from 'utils/msgChannel'

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
