import { wrap } from 'comlink'
import MainWorker from 'main/main.worker'
import { msg } from 'utils/msgChannel'
import { episodeSub } from 'utils/hooks'

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

mainWorker.onmessage = ({ type, data }) => {
  if (!type || typeof data?.type !== 'string') return
  if (data.type === 'episodes') {
    episodeSub.setState({
      ...episodeSub.state,
      ...Object.fromEntries(
        Object.entries(data.episodes).map(([k, v]) => [
          k,
          [...(episodeSub.state[k] ?? []), ...(v as EpisodeMin[])].sort(
            (a, b) => b.published - a.published
          ),
        ])
      ),
    })
  }
}
