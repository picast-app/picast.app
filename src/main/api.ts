import { GraphQLClient } from 'graphql-request'
import type * as T from 'gql/types'
import podcastQuery from 'gql/queries/podcast.gql'
import feedQuery from 'gql/queries/feed.gql'
import searchQuery from 'gql/queries/search.gql'
import episodeQuery from 'gql/queries/podcastEpisodes.gql'

export const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
})

export async function podcast(id: string) {
  const { podcast } = await client.request<
    T.PodcastPage,
    T.PodcastPageVariables
  >(podcastQuery, { id })
  return podcast
}

export async function feed(url: string) {
  const { feed } = await client.request<T.FetchFeed, T.FetchFeedVariables>(
    feedQuery,
    { url }
  )
  return feed
}

export async function search(query: string) {
  const { search } = await client.request<
    T.SearchPodcast,
    T.SearchPodcastVariables
  >(searchQuery, { query })
  return search
}

export async function episodes(id: string, limit: number, cursor: string) {
  const { podcast } = await client.request<
    T.PodcastEpisodes,
    T.PodcastEpisodesVariables
  >(episodeQuery, {
    podcast: id,
    cursor,
    last: limit,
  })
  return podcast?.episodes
}
