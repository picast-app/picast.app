import Service from './base'
import { main } from 'workers'

const ms = navigator.mediaSession

export default class Session extends Service {
  public enable() {
    if (!ms) return
    ms.setActionHandler('play', () => main.playerResume())
    ms.setActionHandler('pause', () => main.playerPause())
    ms.setActionHandler('stop', () => main.playerPause())
    ms.setActionHandler('nexttrack', () => this.player.jump(30, true))
    ms.setActionHandler('previoustrack', () => this.player.jump(-15, true))
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

  public showInfo() {
    // if (!ms) return
    // const [podcast, episode] = this.player.current ?? []
    // if (!podcast) throw Error("couldn't set ms info, podcast missing")
    // if (!episode) throw Error("couldn't set ms info, episode missing")
    // if (ms.metadata?.title === episode.title) return
    //
    // const meta = new MediaMetadata({
    //   title: episode.title,
    //   artist: podcast.author,
    //   album: podcast.title,
    //   artwork: this.formatArtwork(podcast.covers),
    // })
    // logger.info('set media session metadata', meta)
    // ms.metadata = meta
  }

  private formatArtwork(covers: string[]): MediaImage[] {
    return covers.map(src => ({
      src: `${process.env.IMG_HOST}/${src}`,
      type: `image/${src.split('.').pop()}`,
      sizes: Array(2).fill(src.split('.')[0].split('-').pop()).join('x'),
    }))
  }
}
