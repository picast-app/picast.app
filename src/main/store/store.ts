import dbProm, { gql as convert } from './idb'
import * as api from 'main/api'
import { proxy } from 'comlink'
import { Podcast, Episode, EpisodeBase } from './types'
import * as Feed from './feed'
import EpisodeStore from './episodeStore'
import ws, { wsApi } from 'main/ws'
import type * as T from 'types/gql'

type SubscriptionCB = (v: { added?: string[]; removed?: string[] }) => void
type TotalCB = (v: { total: number; complete: boolean }) => void

export default class Store {
  private readonly podcasts: Record<Podcast['id'], Podcast> = {}
  private subscriptions: Podcast['id'][] = []
  private subCB?: SubscriptionCB
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

  public getSubscriptions(): string[] {
    return this.subscriptions
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

    const podcast: Podcast = convert.podcast(remote)
    this.podcasts[id] = podcast
    podcast.incomplete = episodes.length === 0

    return podcast
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
    if (cb && this.subCB) this.subCB!({ added: [id] })
    await this.storeSubscription(id)
    await this.epStore.subscribe(id)
    if (!existing) await api.subscribe(id)
  }

  public async removeSubscription(id: string, existing: boolean, cb = true) {
    logger.info('unsubscribe from', id)
    if (!this.subscriptions.includes(id)) return
    this.subscriptions = this.subscriptions.filter(v => v !== id)
    if (cb && this.subCB) this.subCB({ removed: [id] })
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

  public async setSubscriptionCB(cb: SubscriptionCB): Promise<string[]> {
    this.subCB = cb
    return this.subscriptions
  }

  private async storeSubscription(id: string) {
    const { incomplete, ...podcast } = this.podcasts[id]
    await this.db.put('subscriptions', podcast)
  }

  public async getPlaying(): Promise<EpisodeId | null> {
    return (await this.db.get('meta', 'playing')) ?? null
  }

  public async setPlaying(id: EpisodeId | null) {
    if (id) await this.db.put('meta', id, 'playing')
    else await this.db.delete('meta', 'playing')
  }

  public async getProgress(): Promise<number | null> {
    return (await this.db.get('meta', 'progress')) ?? null
  }

  public async setProgress(progress: number | null) {
    if (typeof progress === 'number')
      await this.db.put('meta', progress, 'progress')
    else await this.db.delete('meta', 'progress')
  }

  private getFeedSub(id: string): Feed.Base | undefined {
    return this.feedSubs.find(v => v.id === id)
  }
}
