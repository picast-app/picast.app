import EventDispatcher from 'app/utils/event'

export default EventDispatcher as new () => EventDispatcher<{
  play(): void
  pause(): void
  current(v: CurrentPlayback): void
  jump(n: number, id?: EpisodeId): void
  duration(n: number, id?: EpisodeId): void
}>
