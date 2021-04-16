import type { EpisodeBase } from 'main/store/types'

export type UpdateCB = (v: EpisodeBase) => void
type UnsubCB = () => void

// keeps track of subscribers per index
export abstract class Base {
  constructor(public readonly id = ((Math.random() * 1e6) | 0).toString(36)) {}

  protected subs: UpdateCB[][] = []

  public addSub(index: number, update: UpdateCB): UnsubCB {
    ;(this.subs[index] ??= []).push(update)
    this.onSub(index, update)
    return () => {
      this.subs[index] = this.subs[index].filter(f => f !== update)
    }
  }

  abstract onSub(index: number, update: UpdateCB): void
}
