import { VirtualPlayer } from '../virtualPlayer'
import { store } from 'store'
import Egress from './egress'
import uiThread from 'main/ui'

export default function observe(player: VirtualPlayer): VirtualPlayer {
  // prettier-ignore
  const timeEvents = ['play', 'playing', 'stop', 'waiting', 'jump', 'finalize'] as const
  for (const e of timeEvents) player.addEventListener(e, savePos)

  uiThread.addEventListener('pagehide', savePos)

  function savePos() {
    const pos = player.getPosition()
    const id = player.track
    if (!id || typeof pos !== 'number') return
    Egress.episode(id).currentTime(player.getPosition())
    store.set('episodes.*.currentTime', player.getPosition(), {}, id[1])
    const prog = pos / player.duration!
    if (Number.isFinite(prog)) store.set('episodes.*.relProg', prog, {}, id[1])
  }

  player.addEventListener('changeTrack', (id, src, pos, passive) => {
    if (!id || typeof pos !== 'number') return
    Egress.episode(id).setCurrent(pos, passive)
  })

  return player
}
