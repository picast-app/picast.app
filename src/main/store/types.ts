import type Schema from './schema'

export type { Schema }
export type Podcast = Schema['subscriptions']['value'] & {
  incomplete?: boolean
}
export type Episode = Schema['episodes']['value']
export type EpisodeBase = Omit<Episode, 'description'>
