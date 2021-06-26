import type { Store } from 'store'

export default (store: Store) => {
  store.handler('episodes.*.*.shownotes').get(() => 'hello there')
}
