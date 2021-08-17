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

    if (!msgs.length) return
    const batch = ws.batch?.()
    if (!batch) return logger.info('play sync', ...msgs)

    msgs.forEach(msg => batch.notify('playSync', { msg, token }))
    await batch
  }
}

class EpisodeSync {
  constructor(public readonly id: EpisodeId) {}
  public readonly queue: Message<Type>[] = []

  private last: { [K in Type]?: Message<K> } = {}

  private addMessage<T extends Type>(
    msg: PickOpt<Message<T>, 'time'>,
    time = new Date().toISOString()
  ) {
    this.queue.push((this.last[msg.type] = { time, ...msg } as any))
  }

  public currentTime(seconds: number) {
    if (
      Math.abs(
        (this.last.SET_PLAYBACK_TIME?.pos ?? this.initialTime!) - seconds
      ) < 2
    )
      return
    logger.info(
      'set time',
      ...this.id,
      seconds,
      'was',
      this.last.SET_PLAYBACK_TIME?.pos ?? this.initialTime
    )
    this.addMessage({
      type: 'SET_PLAYBACK_TIME',
      id: this.id,
      pos: seconds,
    })
    EgressInterface.pull()
  }

  public setCurrent(pos: number, passive = false) {
    this.initialTime = pos
    if (passive) return
    this.addMessage({ type: 'SET_ACTIVE', id: this.id, pos })
    EgressInterface.pull()
  }

  private initialTime?: number
}
