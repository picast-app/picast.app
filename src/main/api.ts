import { GraphQLClient } from 'graphql-request'
import type * as T from 'types/gql'
import podcastQuery from 'gql/queries/podcast.gql'
import episodeQuery from 'gql/queries/episode.gql'
import feedQuery from 'gql/queries/feed.gql'
import searchQuery from 'gql/queries/search.gql'
import episodesQuery from 'gql/queries/podcastEpisodes.gql'
import googleSigninMutation from 'gql/mutations/signInGoogle.gql'
import meQuery from 'gql/queries/me.gql'
import subscribeMutation from 'gql/mutations/subscribe.gql'
import unsubscribeMutation from 'gql/mutations/unsubscribe.gql'
import metaSyncQuery from 'gql/queries/metaSync.gql'
import parseMutation from 'gql/mutations/parse.gql'
import deleteMutation from 'gql/mutations/delete.gql'
import diffEpisodesQuery from 'gql/queries/episodes.gql'
import signOutMutation from 'gql/mutations/signOut.gql'
import addWpSubMutation from 'gql/mutations/wpSub.gql'
import removeWpSubMutation from 'gql/mutations/wpUnsub.gql'

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

export async function signInGoogle(accessToken: string, wpSub?: string) {
  const { signInGoogle: me } = await client.request<
    T.SignInGoogle,
    T.SignInGoogleVariables
  >(googleSigninMutation, { accessToken, wpSub })
  return me
}

export async function signOut() {
  await client.request(signOutMutation)
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

export async function metaSync(
  sums: { id: string; meta?: string; episodes?: string }[]
) {
  const { metaCheck } = await client.request<T.MetaSync, T.MetaSyncVariables>(
    metaSyncQuery,
    { sums }
  )
  return metaCheck
}

export async function parse(id: string) {
  await client.request<T.Parse, T.ParseVariables>(parseMutation, { id })
}

export async function deletePodcast(id: string) {
  await client.request<T.Delete, T.DeleteVariables>(deleteMutation, { id })
}

export async function diffEpisodes(...podcasts: [id: string, known: string][]) {
  const { episodeDiff } = await client.request<
    T.FetchEpisodeDiff,
    T.FetchEpisodeDiffVariables
  >(diffEpisodesQuery, {
    podcasts: podcasts.map(([id, known]) => ({ id, known })),
  })
  return episodeDiff
}

export async function wpSub(sub: string) {
  await client.request(addWpSubMutation, { sub })
}

export async function wpUnsub(sub: string) {
  await client.request(removeWpSubMutation, { sub })
}
