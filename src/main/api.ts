import { GraphQLClient } from 'graphql-request'
import type * as T from 'gql/types'
import podcastQuery from 'gql/queries/podcast.gql'
import episodeQuery from 'gql/queries/episode.gql'
import feedQuery from 'gql/queries/feed.gql'
import searchQuery from 'gql/queries/search.gql'
import episodesQuery from 'gql/queries/podcastEpisodes.gql'
import googleSigninMutation from 'gql/mutations/signInGoogle.gql'
import meQuery from 'gql/queries/me.gql'
import subscribeMutation from 'gql/mutations/subscribe.gql'
import unsubscribeMutation from 'gql/mutations/unsubscribe.gql'

export const client = new GraphQLClient(process.env.REACT_APP_API as string, {
  headers: {},
  credentials: 'include',
})

export async function podcast(id: string) {
  const { podcast } = await client.request<
    T.PodcastPage,
    T.PodcastPageVariables
  >(podcastQuery, { id })
  return podcast
}

export async function episode([podId, epId]: EpisodeId) {
  const { episode } = await client.request<
    T.SingleEpisode,
    T.SingleEpisodeVariables
  >(episodeQuery, { podId, epId })
  return episode
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

export async function episodes(id: string, limit: number, cursor?: string) {
  const { podcast } = await client.request<
    T.PodcastEpisodes,
    T.PodcastEpisodesVariables
  >(episodesQuery, {
    podcast: id,
    cursor: cursor as any,
    last: limit,
  })
  return podcast?.episodes
}

export async function signInGoogle(accessToken: string) {
  const { signInGoogle: me } = await client.request<
    T.SignInGoogle,
    T.SignInGoogleVariables
  >(googleSigninMutation, { accessToken })
  return me
}

export async function me(known?: string[]) {
  const data = await client.request<T.Me, T.MeVariables>(meQuery, { known })
  return data.me
}

export async function subscribe(...ids: string[]) {
  await client.request<T.Subscribe, T.SubscribeVariables>(subscribeMutation, {
    ids,
  })
}

export async function unsubscribe(...ids: string[]) {
  await client.request<T.Unsubscribe, T.UnsubscribeVariables>(
    unsubscribeMutation,
    {
      ids,
    }
  )
}
