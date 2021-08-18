import dbProm from 'main/idb/idb'
import type { Store } from 'store'

export default (store: Store) => {
  const map = new Map<string, string>()
  store
    .handler('ep2Pod.*')
    .get(async (_, id) => map.get(id) ?? (await searchId(id)))
  store.handler('ep2Pod.*').set((pod, p, m, ep) => {
    if (pod) map.set(ep, pod)
  })
  store.listen('player.current', id => {
    if (id) store.set('ep2Pod.*', id[0], {}, id[1])
  })

  async function searchId(id: string) {
    const idb = await dbProm
    const res = await idb.get('episodes', id)
    if (!res?.podcast) return
    store.set('ep2Pod.*', res.podcast, {}, id)
    return res.podcast
  }
}
