type ReactProps<
  T extends (...args: any[]) => JSX.Element | import('react').Component | null
> = Parameters<T>[0]

type PromiseType<T> = T extends PromiseLike<infer I> ? I : T

type PickOpt<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

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
}>

type EpisodeId = [podcast: string, episode: string]

type EpisodeMin = {
  id: string
  title: string
  file: string
  published: number
  currentTime?: number
}

// eslint-disable-next-line no-var
declare var logger: import('utils/logger').default

type SignInCreds = {
  accessToken: string
}
