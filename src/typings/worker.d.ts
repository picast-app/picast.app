type MainAPI = {
  podcast(id: string): Promise<import('gql/types').PodcastTmp['podcast']>
}
