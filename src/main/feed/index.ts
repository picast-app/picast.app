import { store } from 'store'
import { Base as Feed, CB } from './base'
import { Podcast } from './singlePodcast'
import { MultiPodcast } from './multiPodcast'
import epStore from 'main/store/episodeStore'
import { proxy, release, Proxied } from 'fiber'

export async function feedSubscription(...podcasts: string[]) {
  const subs = await store.get('user.subscriptions')
  podcasts = [...new Set(podcasts.flatMap(v => (v === '*' ? subs : [v])))]

  const sub: Feed =
    podcasts.length === 1
      ? new Podcast(await (await epStore).getPodcast(podcasts[0]))
      : await MultiPodcast.create(await epStore, podcasts)

  return sub.id
}

export function cancelFeed(id: string) {
  Feed.instances.get(id)?.delete()
}

const proxyOnce = <T extends λ>(f: T): Proxied<T> => {
  const unsub = proxy((...args: Parameters<T>) => {
    const res = f(...args)
    unsub[release]?.()
    return res
  })
  return unsub as any
}

export function feedItem(sub: string, index: number, cb: CB) {
  const feed = Feed.instances.get(sub)
  if (!feed) throw Error(`feed ${sub} does not exist`)
  return proxyOnce(feed.addSub(index, cb))
}
