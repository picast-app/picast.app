import type Schema from './schema'

export type { Schema }
export type Podcast = Schema['subscriptions']['value'] & {
  incomplete?: boolean
  lastMetaCheck?: number
  lastEpisodeCheck?: number
}
export type Episode = Schema['episodes']['value']
export type EpisodeBase = Omit<Episode, 'description'>
