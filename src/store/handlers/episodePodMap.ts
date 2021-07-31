import type { Store } from 'store'

export default (store: Store) => {
  const map = new Map<string, string>()
  store.handler('ep2Pod.*').get((_, id) => map.get(id))
  store.handler('ep2Pod.*').set((pod, p, m, ep) => {
    if (pod) map.set(ep, pod)
  })
  store.listen('player.current', id => {
    if (id) store.set('ep2Pod.*', id[0], {}, id[1])
  })
}
