import type Component from './base.comp'
import Player from './playerBar/player.comp'
import ProgressBar from './progressBar/progress.comp'

function register<T extends new () => Component>(component: T) {
  customElements.define((component as any).tagName, component)
}

register(Player)
register(ProgressBar)

export type { Player, ProgressBar }
