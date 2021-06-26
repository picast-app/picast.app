import type { EpisodeBase } from 'store/state'
import type { Store } from '.'
import idb from 'main/store/idb'
import { mergeInPlace, seg } from 'utils/path'
import { diff } from 'utils/array'
import { allFlat } from 'utils/promise'

export default (store: Store) => {
  const cache: { [pod: string]: { [ep: string]: EpisodeBase } } = {}

  let subscriptions: Promise<string[]> = store.get('user.subscriptions')

  store.handler('episodes.*.*').set(async (data, path, { known }, pod, id) => {
    if (!data) return
    mergeInPlace((cache[pod] ??= {}), data, ...seg(path, 2))
    if (!known && (await subscriptions).includes(pod))
      await writeToDB(cache[pod][id])
  })

  store
    .handler('episodes.*.*')
    .get(async (_, pod, id) => cache[pod]?.[id] ?? (await readIDB(pod, id)))

  async function readIDB(podcast: string, id: string) {
    const data = await (await idb).get('episodes', id)
    if (data) store.set('episodes.*.*', data, { known: true }, podcast, id)
    return data ?? null
  }

  async function writeToDB(episode: EpisodeBase) {
    await (await idb).put('episodes', episode)
  }

  async function removeFromDB(...podcasts: string[]) {
    const db = await idb
    const keys = await allFlat(
      podcasts.map(id => db.getAllKeysFromIndex('episodes', 'podcast', id))
    )
    if (!keys.length) return

    // write uncached episodes in db to cache
    const known = new Set(podcasts.flatMap(id => Object.keys(cache[id] ?? {})))
    const unknown = keys.filter(key => !known.has(key))
    await readToCache(unknown)

    logger.info(`remove ${keys.length} episodes from db`)
    const tx = db.transaction('episodes', 'readwrite')
    await Promise.all<any>([...keys.map(id => tx.store.delete(id)), tx.done])
  }

  async function storeInDB(...podcasts: string[]) {
    const episodes = podcasts.flatMap(id => Object.values(cache[id] ?? {}))
    if (!episodes.length) return
    logger.info(`store ${episodes.length} episodes in db`)
    logger.info(episodes)
    const tx = (await idb).transaction('episodes', 'readwrite')
    await Promise.all<any>([episodes.map(v => tx.store.put(v)), tx.done])
  }

  async function readToCache(keys: string[]) {
    if (!keys.length) return
    const db = await idb
    await Promise.all(
      keys.map(async key => {
        const episode = await db.get('episodes', key)
        if (episode)
          store.set('episodes.*.*', episode, {}, episode.podcast, episode.id)
      })
    )
  }

  store.listen('user.subscriptions', async subs => {
    const [added, removed] = diff(await subscriptions, subs)
    subscriptions = Promise.resolve(subs)
    await storeInDB(...added)
    await removeFromDB(...removed)
  })
}
