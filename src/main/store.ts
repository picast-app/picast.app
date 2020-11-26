import { openDB } from 'idb'
import * as api from './api'
import { pickKeys } from 'utils/object'
import type * as T from 'gql/types'

export const dbProm = openDB<EchoDB>(self.location.hostname, 3, {
  upgrade(db) {
    db.createObjectStore('meta').put('UP_TO_DATE', 'updateStatus')
    db.createObjectStore('subscriptions')
  },
})

export abstract class Store {
  private static _subscriptions: string[] = []
  private static _podcasts: {
    [id: string]: EchoDB['subscriptions']['value']
  } = {}
  private static _init = Store.__init().then(() => dbProm)

  private static async __init() {
    const db = await dbProm
    const subs = await db.getAll('subscriptions')
    Store._subscriptions = subs?.map(({ id }) => id) ?? []
    subs.forEach(v => {
      Store._podcasts[v.id] = v
    })
  }

  public static async subscribe(id: string) {
    const db = await Store._init
    if (Store._subscriptions.includes(id)) return
    Store._subscriptions.push(id)
    const podcast = await Store.podcast(id)
    if (!podcast) return
    await db.put(
      'subscriptions',
      {
        ...pickKeys(podcast, [
          'id',
          'title',
          'author',
          'artwork',
          'description',
        ]),
        subscriptionDate: new Date(),
      },
      id
    )
  }

  public static async podcast(id: string) {
    await Store._init
    if (id in Store._podcasts) return Store._podcasts[id]
    const podcast = await api.podcast(id)
    if (!podcast) return
    Store._podcasts[id] = podcast
    Store.fetchRemainingEpisodes(podcast.id)
    return podcast
  }

  private static async fetchRemainingEpisodes(id: string) {
    const podcast = Store._podcasts[id] as T.PodcastPage_podcast
    if (!podcast?.episodes.pageInfo.hasPreviousPage) return
    console.log('fetch episodes', id)

    const cursor = (Store._podcasts[id] as any).episodes.edges.slice(-1)[0]
      .cursor

    const res = await api.episodes(id, 200, cursor)
    if (!res) return
    podcast.episodes.edges.push(...res.edges)
    podcast.episodes.pageInfo.hasPreviousPage = res.pageInfo.hasPreviousPage
    Store.fetchRemainingEpisodes(id)
  }
}
