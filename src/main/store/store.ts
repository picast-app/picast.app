/* eslint-disable @typescript-eslint/require-await */
import dbProm, { gql as convert } from './idb'
import type { Podcast } from 'store/state'
import epStore, { EpisodeStore } from './episodeStore'
import ws from 'main/ws'
import type * as T from 'types/gql'

export default class Store {
  private readonly podcasts: Record<Podcast['id'], Podcast> = {}
  private subscriptions: Podcast['id'][] = []

  constructor(
    private readonly db: PromType<typeof dbProm>,
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
      // this.totalListeners[podcast]?.forEach(listener =>
      //   listener({ total, complete })
      // )
    })

    // ws.on('hasAllEpisodes', async ({ podcast, total }) => {
    //   this.totalListeners[podcast]?.forEach(listener =>
    //     listener({ total, complete: true })
    //   )
    //   ;(await this.epStore.getPodcast(podcast)).hasFeedStart = true
    // })

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

  private async storeSubscription(id: string) {
    // const { incomplete, ...podcast } = this.podcasts[id]
    const podcast = this.podcasts[id] //
    podcast.lastMetaCheck = Date.now()
    await this.db.put('subscriptions', podcast)
  }

  // private getFeedSub(id: string): Feed.Base | undefined {
  //   return this.feedSubs.find(v => v.id === id)
  // }

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
