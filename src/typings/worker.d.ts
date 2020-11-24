type MainAPI = {
  podcast(id: string): Promise<import('gql/types').PodcastPage['podcast']>
  feed(url: string): Promise<import('gql/types').FetchFeed['feed']>
  search(query: string): Promise<import('gql/types').SearchPodcast['search']>
}
