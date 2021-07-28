import { APICall as API } from '../client'
import qPodcast from 'app/gql/queries/podcast.gql'
import qEpisode from 'app/gql/queries/episode.gql'
import qFeed from 'app/gql/queries/feed.gql'
import qSearch from 'app/gql/queries/search.gql'
import qEpisodes from 'app/gql/queries/podcastEpisodes.gql'
import qMe from 'app/gql/queries/me.gql'
import qMetaSync from 'app/gql/queries/metaSync.gql'
import qDiffEpisodes from 'app/gql/queries/episodes.gql'

export const podcast = API<'PodcastPage'>(qPodcast)(
  (id: string) => ({ id }),
  ({ podcast }) => podcast
)

export const episode = API<'SingleEpisode'>(qEpisode)(
  ([podId, epId]: EpisodeId) => ({ podId, epId }),
  ({ episode }) => episode
)

export const feed = API<'FetchFeed'>(qFeed)(
  (url: string) => ({ url }),
  ({ feed }) => feed
)

export const search = API<'SearchPodcast'>(qSearch)(
  (query: string) => ({ query }),
  ({ search }) => search
)

export const episodes = API<'PodcastEpisodes'>(qEpisodes)(
  (id: string, limit: number, cursor?: string) => ({
    podcast: id,
    cursor,
    last: limit,
  }),
  ({ podcast }) => podcast
)

export const me = API<'Me'>(qMe)(
  (known?: string[]) => ({ known }),
  ({ me }) => me
)

export const metaSync = API<'MetaSync'>(qMetaSync)(
  (sums: { id: string; meta?: string; episodes?: string }[]) => ({ sums }),
  ({ metaCheck }) => metaCheck
)

export const diffEpisodes = API<'FetchEpisodeDiff'>(qDiffEpisodes)(
  (...podcasts: readonly [id: string, known: string][]) => ({
    podcasts: podcasts.map(([id, known]) => ({ id, known })),
  }),
  ({ episodeDiff }) => episodeDiff
)
