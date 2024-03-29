import dbProm from 'main/idb/idb'
import * as convert from 'api/convert'
import * as api from 'api/calls'
import { Episode } from 'store/state'
import { store } from 'store'
import { bindThis } from 'utils/proto'
import { callAll } from 'utils/function'

type Key = [id: string, published: number]

export class Podcast {
  public hasFeedStart = false
  private tasks: Promise<any>[] = []
  private listeners: ((...i: number[]) => void)[] = []
  private static created: string[] = []

  private constructor(
    public readonly id: string,
    private readonly db: PromType<typeof dbProm>,
    private keys: Key[],
    private subscribed: boolean
  ) {}

  public static async create(
    id: string,
    db: PromType<typeof dbProm>,
    subscribed: boolean
  ) {
    logger.assert(
      !Podcast.created.includes(id),
      `episode store ${id} already created`
    )
    Podcast.created.push(id)
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

  public get total() {
    return this.keys.length
  }

  public get isSubscribed() {
    return this.subscribed
  }

  public async subscribe() {
    if (this.subscribed) return
    this.subscribed = true
    while (!this.hasFeedStart) await this.fetch(1000)
  }

  public unsubscribe() {
    if (!this.subscribed) return
    this.subscribed = false
  }

  public get = async (index: number) =>
    await this.addTask(async () => {
      if (index >= this.keys.length) {
        await this.fetch(index - this.keys.length + 1)
      }
      return this.read(index)
    })

  public read(index: number) {
    return this.keys[index]?.[0]
  }

  private async fetch(n: number) {
    if (this.hasFeedStart)
      return logger.warn('skip episode fetch', this.keys.length, n)
    n = Math.max(n, 200)
    logger.info('fetch', this.id, n)
    const { episodes: data } =
      (await api.query.episodes(this.id, n, this.keys.slice(-1)[0]?.[0])) ?? {}
    if (!data) {
      this.hasFeedStart = true
      logger.error('failed to fetch', this.id)
      return
    }
    if (!data.pageInfo.hasNextPage) this.hasFeedStart = true
    const nodes = data.edges.map(({ node }) => node)
    const episodes = nodes.map(node => convert.episode(node as any, this.id)!)
    this.addEpisodes(episodes)
  }

  public addEpisodes(episodes: Episode[], notify = false) {
    this.addKeys(Podcast.keys(episodes.map(({ id }) => id)))
    // logger.info(`[epStore ${this.id}] add ${episodes.length} episodes`, {
    //   subscribed: this.subscribed,
    //   keys: this.keys,
    // })
    episodes.map(data =>
      store.set('episodes.*', data, { subbed: this.subscribed }, data.id)
    )
    if (!notify) return
    store.set('podcasts.*.episodeCount', this.keys.length, {}, this.id)
    const indices = episodes.map(v =>
      this.keys.findIndex(([id]) => id === v.id)
    )
    callAll(this.listeners, ...indices)
  }

  public set onEpisode(listener: (...i: number[]) => void) {
    this.listeners.push(listener)
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

  private static keys(ids: string[]): Key[] {
    return ids
      .map(id => [id, parseInt(id.slice(0, 6), 36) * 1000] as Key)
      .sort(([, a], [, b]) => b - a)
  }

  private addKeys(keys: Key[]) {
    const newKeys = keys.filter(([id]) => !this.keys.find(k => k[0] === id))
    this.keys.push(...newKeys)
    this.keys.sort(([, a], [, b]) => b - a)
  }

  public get episodeIds(): string[] {
    return this.keys.map(([id]) => id)
  }
}

export class EpisodeStore {
  private podcasts: Record<string, Promise<Podcast>> = {}
  private subscriptions: Promise<string[]> = store.get('user.subscriptions')

  constructor(private readonly db: PromType<typeof dbProm>) {
    bindThis(this)
    this.listenSubs()
  }

  public getPodcast = async (id: string, subscribed?: boolean) => {
    const podcast = await (this.podcasts[id] ??= (
      subscribed ? Promise.resolve([id]) : this.subscriptions
    ).then(subs => Podcast.create(id, this.db, subs.includes(id))))
    if (subscribed && !podcast.isSubscribed) await podcast.subscribe()
    return podcast
  }

  private async listenSubs() {
    await this.subscriptions
    store.handler('user.subscriptions').set(this.setSubs)
  }

  private async setSubs(subs: string[]) {
    const subscriptions = await this.subscriptions
    const addSubs = subs.filter(id => !subscriptions.includes(id))
    const delSubs = subscriptions.filter(id => !subs.includes(id))
    this.subscriptions = Promise.resolve(subs)

    await Promise.all([
      ...addSubs.map(id => this.getPodcast(id).then(pod => pod.subscribe())),
      ...delSubs.map(id => this.getPodcast(id).then(pod => pod.unsubscribe())),
    ])
  }
}

export default dbProm.then(
  db => ((globalThis as any).epStore = new EpisodeStore(db))
)
