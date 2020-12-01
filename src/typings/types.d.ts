type ReactProps<
  T extends (...args: any[]) => JSX.Element | import('react').Component | null
> = Parameters<T>[0]

type RGBA = number
type RGBA_ = [number, number, number, number]

type EchoPlayEvent = CustomEvent<{ episode?: EpisodeId }>
type EchoJumpEvent = CustomEvent<{ location: number }>
type EchoSnackEvent = CustomEvent<{
  text: string
  action?: string
  timeout?: number | 'never'
  actionEvent?: string
}>

type EpisodeId = [podcast: string, episode: string]

type EpisodeMin = {
  id: string
  title: string
  file: string
  published: number
}

type Podcast = import('gql/types').PodcastPage_podcast & {
  episodeCount?: number
}
