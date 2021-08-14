import { VirtualPlayer } from '../virtualPlayer'
import { store } from 'store'
import Egress from './egress'

export default function observe(player: VirtualPlayer): VirtualPlayer {
  // prettier-ignore
  const timeEvents = ['play', 'playing', 'stop', 'waiting', 'jump', 'finalize'] as const
  for (const e of timeEvents)
    player.addEventListener(e, () => {
      const pos = player.getPosition()
      const id = player.track
      if (!id || typeof pos !== 'number') return
      Egress.episode(id).currentTime(player.getPosition())
      store.set('episodes.*.currentTime', player.getPosition(), {}, id[1])
      const prog = pos / player.duration!
      if (Number.isFinite(prog))
        store.set('episodes.*.relProg', prog, {}, id[1])
    })

  player.addEventListener('changeTrack', () => {
    const pos = player.getPosition()
    const id = player.track
    if (!id || typeof pos !== 'number') return
    Egress.episode(id).setCurrent(pos)
  })

  return player
}
