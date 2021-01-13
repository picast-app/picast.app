type MainAPI = {
  podcast(id: string): Promise<Podcast>
  episode(id: EpisodeId): Promise<EpisodeMin | undefined>
  feed(url: string): Promise<import('gql/types').FetchFeed['feed']>
  search(query: string): Promise<import('gql/types').SearchPodcast['search']>
  subscribe(id: string): void
  unsubscribe(id: string): void
  subscriptions(cb: SubscriptionListener): Promise<string[]>
  playing(): EpisodeId
  setPlaying(episode: EpisodeId | null, progress?: number): void
  progress(): number
  setProgress(v: number): void
  signIn(v: SignInCreds): void
  me(): Promise<import('gql/types').Me['me']>
}

type SignInCreds = {
  accessToken: string
}

type SubscriptionListener = (v: {
  added?: string[]
  removed?: string[]
}) => void
