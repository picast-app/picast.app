import type Component from './base.comp'
import Player from './playerBar/player.comp'
import ProgressBar from './progressBar/progress.comp'
import Audio from './audio.comp'

function register<T extends new () => Component>(
  component: T,
  name: string = (component as any).tagName
) {
  customElements.define(name, component)
}

register(Player)
register(ProgressBar)
register(Audio, 'picast-audio')

export type { ProgressBar }
