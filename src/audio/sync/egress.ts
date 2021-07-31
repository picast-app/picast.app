import type { Message, Type } from '@picast-app/protocols/playbackSync'
import { wsApi as ws } from 'main/ws'
import { store } from 'store'

export default class EgressInterface {
  private static episodes = new Map<string, EpisodeSync>()
  public static episode(id: EpisodeId) {
    if (!EgressInterface.episodes.has(id[1]))
      EgressInterface.episodes.set(id[1], new EpisodeSync(id))
    return EgressInterface.episodes.get(id[1])!
  }

  public static async pull() {
    const token = await store.get('user.wsAuth')
    if (!token) return logger.warn("don't send ws sync msg")

    const msgs: Message<Type>[] = []
    for (const [, episode] of this.episodes)
      msgs.push(...episode.queue.splice(0))

    await Promise.all(msgs.map(msg => ws.notify('playSync', { msg, token })))
  }
}

class EpisodeSync {
  constructor(public readonly id: EpisodeId) {}
  public readonly queue: Message<Type>[] = []

  private last: { [K in Type]?: Message<K> } = {}

  private addMessage<T extends Type>(msg: Message<T>) {
    this.queue.push((this.last[msg.type] = msg as any))
  }

  public currentTime(seconds: number) {
    if (this.last.SET_PLAYBACK_TIME?.pos === seconds) return
    this.addMessage({
      type: 'SET_PLAYBACK_TIME',
      id: this.id,
      pos: seconds,
      time: new Date().toISOString(),
    })
    EgressInterface.pull()
  }
}
