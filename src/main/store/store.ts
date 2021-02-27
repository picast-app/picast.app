import dbProm, { gql as convert } from './idb'
import * as api from 'main/api'
import { proxy } from 'comlink'
import { Podcast, Episode, EpisodeBase } from './types'
import * as Feed from './feed'
import EpisodeStore from './episodeStore'
import ws, { wsApi } from 'main/ws'
import appState from '../appState'
import type * as T from 'types/gql'
import { hashIds, encodeIds } from 'utils/encode'

type TotalCB = (v: { total: number; complete: boolean }) => void

export default class Store {
  private readonly podcasts: Record<Podcast['id'], Podcast> = {}
  private subscriptions: Podcast['id'][] = []
  private feedSubs: Feed.Base[] = []
  private totalListeners: Record<Podcast['id'], TotalCB[]> = {}

  constructor(
    private readonly db: PromiseType<typeof dbProm>,
    private readonly epStore: EpisodeStore,
    subs: Podcast[]
  ) {
    this.subscriptions = subs.map(({ id }) => id)
    for (const podcast of subs) this.podcasts[podcast.id] = podcast

    ws.on('episodeAdded', async ({ podcast, episodes }) => {
      const formatted = episodes.map(({ url, published, ...rest }: any) => ({
        file: url,
        published: published * 1000,
        podcast,
        ...rest,
      }))
      const store = await this.epStore.getPodcast(podcast)
      await store.addEpisodes(formatted, true)
      const { total, hasFeedStart: complete } = store
      this.totalListeners[podcast]?.forEach(listener =>
        listener({ total, complete })
      )
    })

    ws.on('hasAllEpisodes', async id => {
      const store = await this.epStore.getPodcast(id)
      store.hasFeedStart = true
      this.totalListeners[id]?.forEach(listener =>
        listener({ total: store.total, complete: true })
      )
    })
  }

  public static async create(): Promise<Store> {
    const db = await dbProm
    const subs = await db.getAll('subscriptions')
    const eps = new EpisodeStore(
      db,
      subs.map(({ id }) => id)
    )
    return new Store(db, eps, subs)
  }

  public async refresh() {
    logger.info('refresh idb')
    const subs = await this.db.getAll('subscriptions')
    for (const podcast of subs) {
      if (this.subscriptions.includes(podcast.id)) continue
      this.subscriptions.push(podcast.id)
      this.podcasts[podcast.id] = podcast
    }
    await Promise.all(
      this.subscriptions.map(id =>
        this.epStore.getPodcast(id).then(pod => pod.refresh())
      )
    )
  }

  public getSubscriptions(): string[] {
    return this.subscriptions
  }

  public async podcast(id: string): Promise<Podcast | null> {
    if (id in this.podcasts) return this.podcasts[id]

    let resolve: (v: EpisodeBase[]) => void
    ;(await this.epStore.getPodcast(id)).waitFor(
      new Promise<EpisodeBase[]>(res => {
        resolve = res
      })
    )

    const remote = await api.podcast(id)
    const episodes =
      remote?.episodes?.edges.map(
        ({ node }) => convert.episode(node as any, id)!
      ) ?? []
    resolve!(episodes)
    if (!episodes.length) wsApi.notify('subscribeEpisodes', id)

    if (!remote) return null

    const podcast = await this.writePodcastMeta(remote)
    podcast.incomplete = episodes.length === 0
    return podcast
  }

  public async writePodcastMeta(meta: T.PodcastInfo): Promise<Podcast> {
    const podcast = convert.podcast(meta)
    this.podcasts[podcast.id] = podcast
    if (this.subscriptions.includes(podcast.id))
      await this.storeSubscription(podcast.id)
    return podcast
  }

  public async metaChecked(...ids: string[]) {
    ids = ids.filter(id => this.subscriptions.includes(id))
    const tx = this.db.transaction('subscriptions', 'readwrite')
    ids.forEach(id => {
      this.podcasts[id].lastMetaCheck = Date.now()
      tx.store.put(this.podcasts[id])
    })
    await tx.done
  }

  public async episodeChecked(...ids: string[]) {
    ids = ids.filter(id => this.subscriptions.includes(id))
    const tx = this.db.transaction('subscriptions', 'readwrite')
    ids.forEach(id => {
      this.podcasts[id].lastEpisodeCheck = Date.now()
      tx.store.put(this.podcasts[id])
    })
    await tx.done
  }

  public async fetchEpisodes(...ids: string[]) {
    logger.info('fetch episodes', ...ids)

    const podcasts = Object.fromEntries(
      await Promise.all(
        ids.map(id => this.epStore.getPodcast(id).then(pod => [id, pod]))
      )
    )

    const results = await api.diffEpisodes(
      ...ids.map(
        id => [id, encodeIds(podcasts[id].episodeIds)] as [string, string]
      )
    )

    for (const { podcast, added, removed } of results) {
      if (removed?.length) {
        logger.info(`removed from ${podcast} ${removed.join(', ')}`)
      }
      if (added?.length) {
        logger.info(
          `added to ${podcast} ${added.map(({ id }) => id).join(', ')}`
        )
        await podcasts[podcast].addEpisodes(
          added.map(v => convert.episode(v as any, podcast)),
          true
        )
      }
    }
  }

  public async onTotalChange(
    id: string,
    handler: TotalCB
  ): Promise<() => void> {
    ;(this.totalListeners[id] ??= []).push(handler)
    return proxy(() => {
      this.totalListeners[id] = this.totalListeners[id]!.filter(
        f => f !== handler
      )
    })
  }

  public async episode([podId, epId]: EpisodeId): Promise<EpisodeBase | null> {
    const pod = await this.epStore.getPodcast(podId)
    return (
      (await pod.getById(epId)) ??
      (convert.episode(await api.episode([podId, epId]), podId) as any) ??
      null
    )
  }

  public async episodeInfo([podId, epId]: EpisodeId): Promise<Episode | null> {
    const remote = await api.episode([podId, epId])
    if (!remote) return null
    return convert.episode(remote, podId)
  }

  public async feedSubscription(...podcasts: string[]): Promise<string> {
    if (podcasts.length !== 1) throw Error('multi podcast sub not implemented')
    const sub = new Feed.Podcast(await this.epStore.getPodcast(podcasts[0]))
    logger.info(`add feed sub ${sub.id} for`, ...podcasts)
    this.feedSubs.push(sub)
    return sub.id
  }

  public async cancelFeedSubscription(id: string) {
    const i = this.feedSubs.findIndex(v => v.id === id)
    if (i === -1) return
    logger.info(`cancel feed sub ${id}`)
    this.feedSubs.splice(i, 1)
  }

  public async feedItem(
    subId: string,
    index: number,
    update: (v: EpisodeBase) => void
  ): Promise<(() => void) | undefined> {
    const sub = this.getFeedSub(subId)
    if (!sub) return
    return proxy(sub.addSub(index, update))
  }

  public async addSubscription(id: string, existing: boolean, cb = true) {
    logger.info('subscribe to', id)
    if (this.subscriptions.includes(id)) return
    this.subscriptions.push(id)
    if (!(await this.podcast(id))) throw Error(`can't subscribe to ${id}`)
    const { state } = await appState
    state.subscriptions = this.subscriptions
    await this.storeSubscription(id)
    await this.epStore.subscribe(id)
    if (!existing) await api.subscribe(id)
  }

  public async removeSubscription(id: string, existing: boolean, cb = true) {
    logger.info('unsubscribe from', id)
    if (!this.subscriptions.includes(id)) return
    this.subscriptions = this.subscriptions.filter(v => v !== id)
    const { state } = await appState
    state.subscriptions = this.subscriptions
    await this.db.delete('subscriptions', id)
    await this.epStore.unsubscribe(id)
    if (!existing) await api.unsubscribe(id)
  }

  public async syncSubscriptions({
    add,
    remove,
  }: {
    add: T.Me_me_subscriptions_added[]
    remove: string[]
  }): Promise<{
    removed: string[]
    added: string[]
  }> {
    add ??= []
    remove ??= []

    remove = remove.filter(id => this.subscriptions.includes(id))
    const removed = remove.map(id => this.podcasts[id]!.title)
    await Promise.all(remove.map(id => this.removeSubscription(id, true)))

    add = add.filter(({ id }) => !this.subscriptions.includes(id))
    add.forEach(data => {
      this.podcasts[data.id] = convert.podcast(data)
    })
    await Promise.all(add.map(({ id }) => this.addSubscription(id, true)))

    return {
      removed,
      added: add.map(({ title }) => title),
    }
  }

  private async storeSubscription(id: string) {
    const { incomplete, ...podcast } = this.podcasts[id]
    podcast.lastMetaCheck = Date.now()
    await this.db.put('subscriptions', podcast)
  }

  public async setPlaying(id: EpisodeId | null) {
    if (id) await this.db.put('meta', id, 'playing')
    else await this.db.delete('meta', 'playing')
  }

  public async setEpisodeProgress(id: string, progress: number) {
    const episode = await this.db.get('episodes', id)
    if (!episode) throw Error(`can't update unknown episode ${id}`)
    await this.db.put('episodes', {
      ...episode,
      currentTime: progress,
      relProg: progress / episode.duration,
    })
  }

  public async episodesCrc(podcast: string) {
    const { episodeIds } = await this.epStore.getPodcast(podcast)
    return hashIds(episodeIds)
  }

  private getFeedSub(id: string): Feed.Base | undefined {
    return this.feedSubs.find(v => v.id === id)
  }
}
