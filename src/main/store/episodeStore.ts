import dbProm, { gql as convert } from './idb'
import * as api from 'main/api'
import { EpisodeBase } from './types'

type Key = [id: string, published: number]

export class Podcast {
  private cache?: Record<string, EpisodeBase>
  public hasFeedStart = false
  private tasks: Promise<any>[] = []
  private listeners: ((...i: number[]) => void)[] = []

  constructor(
    private readonly id: string,
    private readonly db: PromiseType<typeof dbProm>,
    private keys: Key[],
    private subscribed: boolean
  ) {
    if (!subscribed) this.cache = {}
  }

  public static async create(
    id: string,
    db: PromiseType<typeof dbProm>,
    subscribed: boolean
  ) {
    const ids = await db.getAllKeysFromIndex('episodes', 'podcast', id)
    const keys = Podcast.keys(ids)
    return new Podcast(id, db, keys, subscribed)
  }

  public async refresh() {
    const ids = await this.db.getAllKeysFromIndex(
      'episodes',
      'podcast',
      this.id
    )
    this.keys = Podcast.keys(ids)
  }

  get total() {
    return this.keys.length
  }

  public async subscribe() {
    const tx = this.db.transaction('episodes', 'readwrite')
    await Promise.all([
      ...Object.values(this.cache!).map(v => tx.store.put(v)),
      tx.done as any,
    ])
    delete this.cache
    this.subscribed = true
    while (!this.hasFeedStart) await this.fetch(1000)
  }

  public async unsubscribe() {
    this.writeToCache(
      await this.db.getAllFromIndex('episodes', 'podcast', this.id)
    )
    const tx = this.db.transaction('episodes', 'readwrite')
    await Promise.all([
      ...this.keys.map(key => tx.store.delete(key[0])),
      tx.done,
    ])
  }

  public get = async (index: number) =>
    await this.addTask(async () => {
      if (index >= this.keys.length) {
        await this.fetch(index - this.keys.length + 1)
      }
      return this.read(index)
    })

  public getById = async (id: string): Promise<EpisodeMin | undefined> => {
    if (!this.subscribed) return this.cache![id]
    if (this.keys.find(([k]) => k === id))
      return await this.db.get('episodes', id)
  }

  public waitFor(episodes: Promise<EpisodeBase[]>) {
    this.addTask(async () => {
      await this.addEpisodes(await episodes)
    })
  }

  private async read(index: number) {
    const id = this.keys[index]?.[0]
    if (!id) return
    if (!this.subscribed) return this.cache![id]
    return await this.db.get('episodes', id)
  }

  private async fetch(n: number) {
    if (this.hasFeedStart)
      return logger.warn('skip episode fetch', this.keys.length, n)
    n = Math.max(n, 200)
    const data = await api.episodes(this.id, n, this.keys.slice(-1)[0]?.[0])
    if (!data) {
      this.hasFeedStart = true
      logger.error('failed to fetch', this.id)
      return
    }
    if (!data.pageInfo.hasNextPage) this.hasFeedStart = true
    const nodes = data.edges.map(({ node }) => node)
    const episodes = nodes.map(node => convert.episode(node as any, this.id)!)
    await this.addEpisodes(episodes)
  }

  public async addEpisodes(episodes: EpisodeBase[], notify = false) {
    this.addKeys(Podcast.keys(episodes.map(({ id }) => id)))
    if (!this.subscribed) this.writeToCache(episodes)
    else {
      const tx = this.db.transaction('episodes', 'readwrite')
      await Promise.all([...episodes.map(v => tx.store.put(v)), tx.done as any])
    }
    if (!notify) return
    const indices = episodes.map(v =>
      this.keys.findIndex(([id]) => id === v.id)
    )
    this.listeners.forEach(f => f(...indices))
  }

  public set onEpisode(listener: (...i: number[]) => void) {
    this.listeners.push(listener)
  }

  private writeToCache(episodes: EpisodeBase[]) {
    for (const episode of episodes) (this.cache ??= {})[episode.id] = episode
  }

  private addTask<T>(task: () => Promise<T>): Promise<T> {
    const go = () => task().then(v => (this.tasks.splice(0, 1), v))
    if (!this.tasks.length) {
      const prom = go()
      this.tasks.push(prom)
      return prom
    }
    return new Promise<T>(res => {
      this.tasks.push(
        this.tasks[this.tasks.length - 1].then(() => go().then(res))
      )
    })
  }

  private static keys(ids: string[]) {
    return ids
      .map(id => [id, parseInt(id.slice(0, 6), 36) * 1000] as Key)
      .sort(([, a], [, b]) => b - a)
  }

  private addKeys(keys: Key[]) {
    const newKeys = keys.filter(([id]) => !this.keys.find(k => k[0] === id))
    this.keys.push(...newKeys)
    this.keys.sort(([, a], [, b]) => b - a)
  }
}

export default class EpisodeStore {
  private podcasts: Record<string, Promise<Podcast>> = {}

  constructor(
    private readonly db: PromiseType<typeof dbProm>,
    private subscribed: string[]
  ) {}

  public getPodcast = async (id: string) =>
    await (this.podcasts[id] ??= Podcast.create(
      id,
      this.db,
      this.subscribed.includes(id)
    ))

  public async subscribe(id: string) {
    const podcast = await this.getPodcast(id)
    await podcast.subscribe()
    this.subscribed.push(id)
  }

  public async unsubscribe(id: string) {
    const podcast = await this.getPodcast(id)
    await podcast.unsubscribe()
    this.subscribed = this.subscribed.filter(v => v !== id)
  }
}
