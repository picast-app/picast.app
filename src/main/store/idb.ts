import { openDB } from 'idb/with-async-ittr'
import type IDBSchema from './schema'
import migrations from './migrations'
import type * as GQL from 'types/gql'
import { omit } from 'utils/object'

const VERSION = 3

export default openDB<IDBSchema>(self.location.hostname, VERSION, {
  async upgrade(db, oldVersion, newVersion) {
    if (!(newVersion! in migrations))
      logger.error(`version ${newVersion} not in migrations`)

    const toApply = Object.keys(migrations)
      .map(parseFloat)
      .sort()
      .filter(n => n > oldVersion && n <= newVersion!)

    for (const version of toApply) {
      logger.info(`upgrade to version ${version}`)
      await migrations[version](db)
    }
  },
})

type NoNull<T> = { [K in keyof T]: Exclude<T[K], null> }

const filterEmpty = <T>(obj: T): NoNull<T> =>
  Object.fromEntries(
    Object.entries(obj).flatMap(([k, v]) =>
      v !== undefined && v !== null ? [[k, v]] : []
    )
  ) as any

const podcast = (
  gql: PickOpt<GQL.PodcastPage_podcast, 'episodes'>
): IDBSchema['subscriptions']['value'] =>
  filterEmpty({
    ...omit(gql, '__typename', 'episodes', 'palette'),
    episodeCount: gql.episodes?.pageInfo.total,
    ...(gql.palette && {
      palette: filterEmpty(omit(gql.palette, '__typename')),
    }),
  })

const episode = <T extends GQL.EpisodeFull | null>(
  gql: T,
  podcast: string
): T extends null ? undefined : IDBSchema['episodes']['value'] => {
  if (!gql) return undefined as any
  const data = omit(filterEmpty(gql as any), '__typename', 'publishDate')
  return {
    ...data,
    podcast,
    published: new Date(gql.publishDate!).getTime(),
    currentTime: 0,
    relProg: 0,
  } as any
}

export const gql = {
  podcast,
  episode,
}
