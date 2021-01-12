import { openDB } from 'idb/with-async-ittr'
import * as api from './api'
import { pickKeys } from 'utils/object'
import type * as T from 'gql/types'
import { ChannelManager } from 'utils/msgChannel'
import * as ws from './ws'

export const dbProm = openDB<EchoDB>(self.location.hostname, 3, {
  upgrade(db) {
    db.createObjectStore('meta').put('UP_TO_DATE', 'updateStatus')
    db.createObjectStore('subscriptions', { keyPath: 'id' })
    const epStore = db.createObjectStore('episodes', { keyPath: 'id' })
    epStore.createIndex('date', 'date')
    epStore.createIndex('podcast', 'podcast')
  },
})

export abstract class Store {
  private static _subscriptions: string[] = []
  private static _podcasts: Record<
    string,
    EchoDB['subscriptions']['value']
  > = {}
  private static _episodes: Record<
    string,
    { episodes: EpisodeMin[]; cursor?: string }
  > = {}

  private static _init = Store.__init().then(() => dbProm)

  private static feedSubs: Record<
    string,
    { podcast: string; limit: number; state: string[]; channel: WorkerName }
  > = {}
  public static channels: ChannelManager<'main'>
  private static subscriptionListeners: SubscriptionListener[] = []

  private static async __init() {
    const db = await dbProm
    const subs = await db.getAll('subscriptions')
    Store._subscriptions = subs?.map(({ id }) => id) ?? []
    subs.forEach(v => {
      Store._podcasts[v.id] = v
    })
  }

  public static async subscribe(id: string, sync = true) {
    const db = await Store._init
    if (Store._subscriptions.includes(id)) return
    if (sync) api.subscribe(id)
    Store._subscriptions.push(id)
    const podcast = await Store.podcast(id)
    if (!podcast) throw Error('failed to fetch podcast ' + id)
    await db.put('subscriptions', {
      ...pickKeys(podcast, [
        'id',
        'title',
        'author',
        'artwork',
        'description',
        'feed',
      ]),
      subscriptionDate: new Date(),
      episodeCount: (podcast as any).episodes?.pageInfo?.total,
    })
    const episodes = Store._episodes[id]?.episodes ?? []

    const tx = db.transaction('episodes', 'readwrite')
    await Promise.all([
      ...episodes.map(episode => tx.store.put({ ...episode, podcast: id })),
      tx.done,
    ] as Promise<any>[])

    Store.subscriptionListeners.forEach(cb => cb({ added: [id] }))
  }

  public static async unsubscribe(id: string, sync = true) {
    if (sync) api.unsubscribe(id)
    const db = await Store._init
    if (!Store._subscriptions.includes(id)) return
    const episodes = await db.getAllKeysFromIndex('episodes', 'podcast', id)
    const tx = db.transaction('episodes', 'readwrite')
    await Promise.all([...episodes.map(id => tx.store.delete(id)), tx.done])
    await db.delete('subscriptions', id)
    Store._subscriptions = Store._subscriptions.filter(v => v !== id)
    Store.subscriptionListeners.forEach(cb => cb({ removed: [id] }))
  }

  public static async podcast(id: string): Promise<any> {
    await Store._init
    if (id in Store._podcasts) {
      Store.addEpisodes(
        id,
        await (await dbProm).getAllFromIndex('episodes', 'podcast', id)
      )
      return Store._podcasts[id]
    }
    const podcast = await api.podcast(id)
    if (!podcast) return
    if (!podcast.episodes)
      ws.send({ type: 'SUB_EPISODES', podcast: podcast.id })

    Store.addPodcastGQL(podcast)
    return podcast
  }

  public static addPodcastGQL(podcast: T.PodcastPage_podcast) {
    if (!podcast?.id || podcast.id in Store._podcasts) return
    Store._podcasts[podcast.id] = podcast
    if (!podcast.episodes) return
    Store.addEpisodesGQL(podcast.id, podcast.episodes)
    Store.fetchRemainingEpisodes(podcast.id)
  }

  public static async episode([podcast, episode]: EpisodeId): Promise<
    EpisodeMin | undefined
  > {
    const db = await Store._init
    let ep = Store._episodes[podcast]?.episodes.find(({ id }) => id === episode)
    if (ep) return ep
    ep = await db.get('episodes', episode)
    return ep
  }

  public static async playing() {
    const db = await Store._init
    return await db.get('meta', 'playing')
  }

  public static async setPlaying(episode: EpisodeId | null, progress = 0) {
    const db = await Store._init
    if (episode) {
      await db.put('meta', episode, 'playing')
      await Store.setProgress(progress ?? 0)
    } else {
      await db.delete('meta', 'playing')
      await Store.setProgress(null)
    }
  }

  public static async progress() {
    const db = await Store._init
    return db.get('meta', 'progress')
  }

  public static async setProgress(v: number | null) {
    const db = await Store._init
    if (typeof v === 'number') await db.put('meta', v, 'progress')
    else await db.delete('meta', 'progress')
  }

  public static async subscriptions(
    cb?: SubscriptionListener
  ): Promise<string[]> {
    await Store._init
    if (cb) Store.subscriptionListeners.push(cb)
    return Store._subscriptions
  }

  public static addFeedSub(
    {
      podcast,
      limit = Infinity,
    }: {
      podcast: string
      limit?: number
    },
    channel: WorkerName
  ) {
    const subId = ((Math.random() * 1e9) | 0).toString(36)
    this.feedSubs[subId] = { podcast, limit, state: [], channel }
    requestAnimationFrame(() => {
      const episodes = Store._episodes[podcast]?.episodes?.slice(0, limit)
      if (!episodes?.length) return
      this.subPush(subId, episodes)
    })
    return subId
  }

  public static cancelFeedSub(subId: string) {
    delete Store.feedSubs[subId]
  }

  private static async fetchRemainingEpisodes(id: string) {
    if (process.env.NODE_ENV === 'development') return
    const cursor = Store._episodes[id].cursor
    if (!cursor) return
    Store.addEpisodesGQL(id, (await api.episodes(id, 200, cursor)) as any)
    Store.fetchRemainingEpisodes(id)
  }

  private static mapEpisodeMin(
    ...episodes: T.PodcastPage_podcast_episodes_edges[]
  ): EpisodeMin[] {
    return episodes.map(
      ({ node: { id, title, file, publishDate } }) =>
        ({
          id,
          title,
          file,
          published: new Date(publishDate ?? 0).getTime(),
        } as EpisodeMin)
    )
  }

  private static addEpisodesGQL(
    podcastId: string,
    con?: T.PodcastPage_podcast_episodes
  ) {
    if (!con) return
    const known = podcastId in Store._episodes
    if (!known) Store._episodes[podcastId] = { episodes: [] }

    Store._episodes[podcastId].episodes.push(
      ...Store.mapEpisodeMin(...con.edges)
    )
    Store._episodes[podcastId].episodes.sort(
      (a, b) => b.published - a.published
    )

    if (con.pageInfo) {
      if (!con.pageInfo.hasPreviousPage)
        delete Store._episodes[podcastId].cursor
      else
        Store._episodes[podcastId].cursor =
          con.edges[con.edges.length - 1].cursor
    }

    Object.entries(Store.feedSubs)
      .filter(([, { podcast }]) => podcast === podcastId)
      .forEach(([id]) => Store.subPush(id))
  }

  public static addEpisodes(podcastId: string, episodes: EpisodeMin[]) {
    if (!(podcastId in Store._episodes))
      Store._episodes[podcastId] = { episodes: [] }

    episodes = episodes.filter(
      ({ id }) => !Store._episodes[podcastId].episodes.find(e => e.id === id)
    )

    Store._episodes[podcastId].episodes.push(...episodes)
    Store._episodes[podcastId].episodes.sort(
      (a, b) => b.published - a.published
    )

    Object.entries(Store.feedSubs)
      .filter(([, { podcast }]) => podcast === podcastId)
      .forEach(([id]) => Store.subPush(id))
  }

  private static subPush(
    id: string,
    episodes: EpisodeMin[] = Store._episodes[
      Store.feedSubs[id].podcast
    ].episodes.slice(-(Store.feedSubs[id].limit ?? Infinity))
  ) {
    const sub = Store.feedSubs[id]
    if (!sub) return
    const newEpisodes = episodes.filter(({ id }) => !sub.state.includes(id))
    Store.channels?.post(sub.channel, 'FEED_ADDED', {
      episodes: newEpisodes,
      subId: id,
    })
    sub.state = episodes.map(({ id }) => id)
  }
}

ws.addListener(msg => {
  if (msg.type !== 'EPISODE_ADDED') return
  Store.addEpisodes(
    msg.podcast,
    msg.episodes.map(({ url, ...rest }: any) => ({ file: url, ...rest }))
  )
})
