import { expose } from 'comlink'
import { GraphQLClient } from 'graphql-request'
import type * as T from 'gql/types'
import podcastQuery from 'gql/queries/podcast.gql'
import feedQuery from 'gql/queries/feed.gql'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let self: DedicatedWorkerGlobalScope
export default null

const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
})

const api: MainAPI = {
  async podcast(id: string) {
    const { podcast } = await client.request<
      T.PodcastPage,
      T.PodcastPageVariables
    >(podcastQuery, { id })
    return podcast
  },
  async feed(url: string) {
    const { feed } = await client.request<T.FetchFeed, T.FetchFeedVariables>(
      feedQuery,
      { url }
    )
    return feed
  },
}

expose(api)
