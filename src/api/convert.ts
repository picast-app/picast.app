import type * as GQL from 'app/types/gql'
import type { Podcast } from 'app/store/state'
import type IDBSchema from 'app/main/idb/schema'
import { omit } from 'app/utils/object'

type NoNull<T> = { [K in keyof T]: Exclude<T[K], null> }

const filterEmpty = <T>(obj: T): NoNull<T> =>
  Object.fromEntries(
    Object.entries(obj).flatMap(([k, v]) =>
      v !== undefined && v !== null ? [[k, v]] : []
    )
  ) as any

export const podcast = (
  remote: PickOpt<GQL.PodcastPage_podcast, 'episodes'> | null,
  subscribed = false
): Podcast | null =>
  remote &&
  filterEmpty({
    ...omit(remote, '__typename', 'episodes', 'palette'),
    episodeCount: remote.episodes?.pageInfo.total,
    ...(remote.palette && {
      palette: filterEmpty(omit(remote.palette, '__typename')),
    }),
    subscribed,
  })

export const episode = <
  T extends PickReq<
    GQL.EpisodeFull,
    'id' | 'title' | 'publishDate' | 'file'
  > | null
>(
  gql: T,
  podcast: string
): T extends null ? undefined : IDBSchema['episodes']['value'] => {
  if (!gql) return undefined as any
  const data = omit(filterEmpty(gql as any), '__typename', 'publishDate')
  return {
    ...data,
    podcast,
    published: new Date(gql.publishDate ?? 0).getTime(),
    currentTime: 0,
    relProg: 0,
  } as any
}
