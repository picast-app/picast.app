type ReactProps<
  T extends (...args: any[]) => JSX.Element | import('react').Component | null
> = Parameters<T>[0]

type RGBA = number
type RGBA_ = [number, number, number, number]

type EchoPlayEvent = CustomEvent<{ episode?: EpisodeId }>
type EchoJumpEvent = CustomEvent<{ location: number }>
type EchoSkipEvent = CustomEvent<{ seconds: number }>
type EchoSnackEvent = CustomEvent<{
  text: string
  action?: string
  timeout?: number | 'never'
  actionEvent?: string
  lvl?: 'error' | 'info'
}>

type EpisodeId = [podcast: string, episode: string]
type Podcast = import('store/state').Podcast
type EpisodeMin = {
  id: string
  title: string
  file: string
  published: number
  currentTime?: number
  relProg?: number
}
type CurrentPlayback = [podcast: Podcast, episode: EpisodeMin] | null

// eslint-disable-next-line no-var
declare var logger: import('utils/logger').default

type SignInCreds = {
  accessToken: string
}

declare namespace Intl {
  class ListFormat {
    constructor(
      locale?: string,
      opts?: {
        type?: 'conjunction' | 'disjunction' | 'unit'
        style?: 'long' | 'short' | 'narrow'
      }
    )
    public format(list: string[]): string
  }
}

type TimeRange = [start: number, end: number]
