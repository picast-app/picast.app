/* eslint-disable @typescript-eslint/require-await */
import dbProm, { gql as convert } from './idb'
import * as api from 'api/calls'
import { proxy } from 'comlink'
import { Episode, EpisodeBase } from './types'
import type { Podcast } from 'store/state'
import * as Feed from '../feed'
import epStore, { EpisodeStore } from './episodeStore'
import ws, { wsApi } from 'main/ws'
import type * as T from 'types/gql'
import * as obj from 'utils/object'
import { store as storeX } from 'store'

type TotalCB = (v: { total: number; complete: boolean }) => void

export default class Store {
  private readonly podcasts: Record<Podcast['id'], Podcast> = {}
  private subscriptions: Podcast['id'][] = []
  private feedSubs: Feed.Base[] = []
  private totalListeners: Record<Podcast['id'], TotalCB[]> = {}

  constructor(
    private readonly db: PromiseType<typeof dbProm>,
    private readonly epStore: EpisodeStore,
    subs: Podcast[],
    private wpSubs: string[]
  ) {
    this.subscriptions = subs.map(({ id }) => id)
    for (const podcast of subs) this.podcasts[podcast.id] = podcast

    ws.on('episodeAdded', async ({ podcast, episodes }) => {
      const formatted = episodes.map(({ url, published, ...rest }: any) => ({
        file: url,
        published: new Date(published).getTime(),
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

    ws.on('hasAllEpisodes', async ({ podcast, total }) => {
      this.totalListeners[podcast]?.forEach(listener =>
        listener({ total, complete: true })
      )
      ;(await this.epStore.getPodcast(podcast)).hasFeedStart = true
    })

    ws.on('hasCovers', async ({ id, covers, palette }) => {
      logger.info('got covers for ' + id, { covers, palette })
      const podcast = this.podcasts[id]
      if (!this.subscriptions.includes(id) || !podcast) return
      if (covers) podcast.covers = covers
      if (palette) podcast.palette = palette
      await this.db.put('subscriptions', podcast)
    })
  }

  public static async create(): Promise<Store> {
    const db = await dbProm
    const subs = await db.getAll('subscriptions')
    const wpSubs = await db.get('meta', 'wpSubs')
    return new Store(db, await epStore, subs, wpSubs ?? [])
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

  public async writePodcastMeta(meta: T.PodcastInfo): Promise<Podcast> {
    const podcast = convert.podcast(meta) as any
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
    // ids.forEach(id => {
    //   this.podcasts[id].lastEpisodeCheck = Date.now()
    //   tx.store.put(this.podcasts[id])
    // })
    await tx.done
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
    return (
      (await storeX.get('episodes.*.*', podId, epId)) ??
      (convert.episode(await api.query.episode([podId, epId]), podId) as any) ??
      null
    )
  }

  public async feedSubscription(...podcasts: string[]): Promise<string> {
    const subs = await storeX.get('user.subscriptions')

    podcasts = Array.from(
      new Set(podcasts.flatMap(v => (v === '*' ? subs : [v])))
    )
    const sub: Feed.Base =
      podcasts.length === 1
        ? new Feed.Podcast(await this.epStore.getPodcast(podcasts[0]))
        : await Feed.MultiPodcast.create(this.epStore, podcasts)
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

  // public async addSubscription(id: string, existing: boolean) {
  //   logger.info('subscribe to', id)
  //   if (this.subscriptions.includes(id)) return
  //   this.subscriptions.push(id)
  //   const podcast = await this.podcast(id)
  //   if (!podcast) throw Error(`can't subscribe to ${id}`)
  //   const { state } = await appState
  //   state.addSubscription(podcast)
  //   await this.storeSubscription(id)
  //   // await this.epStore.subscribe(id)
  //   if (!existing) await api.mutate.subscribe(id)
  // }

  // public async removeSubscription(id: string, existing: boolean) {
  //   logger.info('unsubscribe from', id)
  //   if (!this.subscriptions.includes(id)) return
  //   this.subscriptions = this.subscriptions.filter(v => v !== id)
  //   const { state } = await appState
  //   state.removeSubscription(id)
  //   await this.db.delete('subscriptions', id)
  //   // await this.epStore.unsubscribe(id)
  //   if (!existing) await api.mutate.unsubscribe(id)
  // }

  // public async syncSubscriptions({
  //   add,
  //   remove,
  // }: {
  //   add: T.Me_me_subscriptions_added[]
  //   remove: string[]
  // }): Promise<{
  //   removed: string[]
  //   added: string[]
  // }> {
  //   add ??= []
  //   remove ??= []

  //   remove = remove.filter(id => this.subscriptions.includes(id))
  //   const removed = remove.map(id => this.podcasts[id]!.title)
  //   await Promise.all(remove.map(id => this.removeSubscription(id, true)))

  //   add = add.filter(({ id }) => !this.subscriptions.includes(id))
  //   add.forEach(data => {
  //     this.podcasts[data.id] = convert.podcast(data) as any
  //   })
  //   await Promise.all(add.map(({ id }) => this.addSubscription(id, true)))

  //   return {
  //     removed,
  //     added: add.map(({ title }) => title),
  //   }
  // }

  private async storeSubscription(id: string) {
    // const { incomplete, ...podcast } = this.podcasts[id]
    const podcast = this.podcasts[id] //
    podcast.lastMetaCheck = Date.now()
    await this.db.put('subscriptions', podcast)
  }

  public async setPlaying(id: EpisodeId | null) {
    if (id) await this.db.put('meta', id, 'playing')
    else await this.db.delete('meta', 'playing')
  }

  public async setEpisodeProgress(id: string, progress: number) {
    await this.updateEpisode(id, {
      currentTime: progress,
      relProg: ({ duration }) => progress / duration,
    })
  }

  public async setEpisodeCompleted(id: string) {
    await this.updateEpisode(id, { completed: true }, 'currentTime', 'relProg')
  }

  public async setEpisodeDuration(id: string, duration: number) {
    logger.info(`set ${id} duration:`, duration)
    await this.updateEpisode(id, { duration })
  }

  private async updateEpisode(
    id: string,
    update: {
      [K in keyof Episode]?: Episode[K] | ((v: Episode) => Episode[K])
    },
    ...removed: (keyof Episode)[]
  ) {
    const episode = await this.db.get('episodes', id)
    if (!episode) throw Error(`can't update unknown episode ${id}`)
    for (const key of removed) delete episode[key]
    await this.db.put('episodes', {
      ...episode,
      ...obj.map(update, (k, v) => [
        k,
        typeof v === 'function' ? v(episode) : v,
      ]),
    })
  }

  public async getEpisodeProgress(id: string): Promise<number> {
    const episode = await this.db.get('episodes', id)
    return episode?.relProg ?? 0
  }

  private getFeedSub(id: string): Feed.Base | undefined {
    return this.feedSubs.find(v => v.id === id)
  }

  public async wpSubscriptions(): Promise<string[]> {
    return this.wpSubs
  }

  public async addWpSub(...ids: string[]) {
    this.wpSubs.push(...ids)
    await this.db.put('meta', this.wpSubs, 'wpSubs')
  }

  public async removeWpSubs(...ids: string[]) {
    this.wpSubs = this.wpSubs.filter(id => !ids.includes(id))
    await this.db.put('meta', this.wpSubs, 'wpSubs')
  }
}
/* eslint-enable @typescript-eslint/require-await */
