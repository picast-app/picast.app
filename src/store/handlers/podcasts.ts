import dbProm from 'main/idb/idb'
import { collection, diff } from 'utils/array'
import type { Store } from 'store'
import type { Podcast } from 'store/state'
import * as api from 'api/calls'
import * as convert from 'api/convert'
import epStore from 'main/episodeStore'
import { set } from 'utils/path'
import { waiter } from 'utils/promise'
import { dbPodcast, podKeys } from 'main/idb/schema'

export default async (store: Store) => {
  const [podcasts, init] =
    waiter<Record<string, Promise<Podcast | null> | Podcast | null>>()
  let subs: string[] = []
  let wpSubs: string[] = []

  store.handler('podcasts.*').get(async (_, id) => {
    const pods = await podcasts
    pods[id] ??= fetchPodcast(id)
    return { covers: [], ...(await pods[id]) } as Podcast
  })

  store.handler('podcasts.*').set(async (data, path, meta, id) => {
    const pods = await podcasts
    if (/^\w+\.\w+$/.test(path)) {
      pods[id] = data
      if (data && (subs.includes(id) || meta.subscribed)) await writeDB(data)
    } else {
      let pod = await pods[id]
      if (pod) {
        pod = pods[id] = set(pod, data, ...path.split('.').slice(2))
      }
      if (
        subs.includes(id) &&
        podKeys.all.includes(path.replace(/^\w+\.\w+\./, '') as any)
      )
        await writeDB(pod!)
    }
  })

  subs = await store.get('user.subscriptions')
  store.handler('user.subscriptions').set(setSubs)

  wpSubs = await store.get('user.wpSubs')
  store.handler('user.wpSubs').set(setWpSubs)

  async function setSubs(newSubs: string[]) {
    const [addSubs, delSubs] = diff(subs, newSubs)
    subs = newSubs
    const tx = (await dbProm).transaction('podcasts', 'readwrite')
    const cached = async (id: string) => await (await podcasts)[id]

    await Promise.all<any>([
      ...addSubs.map(id => cached(id).then(v => v && tx.store.put(v, id))),
      ...delSubs.map(id => tx.store.delete(id)),
      tx.done,
    ])

    addSubs.forEach(id => store.set('podcasts.*.subscribed', true, {}, id))
    delSubs.forEach(id => store.set('podcasts.*.subscribed', false, {}, id))
  }

  function setWpSubs(newSubs: string[]) {
    const [added, removed] = diff(wpSubs, newSubs)
    added.forEach(id => store.set('podcasts.*.wpSubscribed', true, {}, id))
    removed.forEach(id => store.set('podcasts.*.wpSubscribed', false, {}, id))
  }

  const hasError = (err: any, ...codes: string[]) =>
    err.response?.errors.find((v: any) => codes.includes(v.extensions.code))

  async function fetchPodcast(id: string): Promise<Podcast | null> {
    try {
      const podcast = await api.query.podcast(id)
      const meta = convert.podcast(podcast, subs.includes(id))
      const pod = await (await epStore).getPodcast(id)
      pod.addEpisodes(
        podcast?.episodes?.edges.map(({ node }) => convert.episode(node, id)) ??
          []
      )
      store.set('podcasts.*', meta, {}, id)
      return meta
    } catch (err) {
      if (hasError(err, 'BAD_USER_INPUT')) return null
      throw err
    }
  }

  const idb = await dbProm
  init(
    collection(
      await idb.getAll('podcasts'),
      ({ id }) => id,
      v => ({
        ...v,
        subscribed: subs.includes(v.id),
        wpSubscribed: wpSubs.includes(v.id),
      })
    )
  )
}

async function writeDB(podcast: Podcast) {
  if (!podcast) return
  const db = await dbProm
  const data = dbPodcast(podcast)
  await db.put('podcasts', data, data.id)
}
