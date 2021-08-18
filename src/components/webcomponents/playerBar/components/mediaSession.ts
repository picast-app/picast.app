import Service from './base'
import { main } from 'workers'
import store from 'store/uiThread/api'

const ms = navigator.mediaSession

export default class Session extends Service {
  public enable() {
    if (!ms) return
    ms.setActionHandler('play', main.player$start)
    ms.setActionHandler('pause', main.player$stop)
    ms.setActionHandler('stop', main.player$stop)
    ms.setActionHandler('nexttrack', () => main.player$jumpBy(30))
    ms.setActionHandler('previoustrack', () => main.player$jumpBy(-15))
  }

  public disable() {
    if (!ms) return
    ms.setActionHandler('play', null)
    ms.setActionHandler('pause', null)
    ms.setActionHandler('stop', null)
    ms.setActionHandler('nexttrack', null)
    ms.setActionHandler('previoustrack', null)
    ms.setPositionState?.()
  }

  public async showInfo(id: EpisodeId) {
    if (!ms || !id) return

    const [podcast, episode] = await Promise.all([
      store.getX('podcasts.*', id[0]),
      store.getX('episodes.*', id[1]),
    ])
    if (!podcast || !episode) throw Error("couldn't fetch ms info")
    if (ms.metadata?.title === episode.title) return

    const meta = new MediaMetadata({
      title: episode.title,
      artist: podcast.author,
      album: podcast.title,
      artwork: this.formatArtwork(podcast.covers),
    })
    logger.info('set media session metadata', meta)
    ms.metadata = meta
  }

  private formatArtwork(covers: string[]): MediaImage[] {
    return covers.map(src => ({
      src: `${process.env.IMG_HOST}/${src}`,
      type: `image/${src.split('.').pop()}`,
      sizes: Array(2).fill(src.split('.')[0].split('-').pop()).join('x'),
    }))
  }
}
