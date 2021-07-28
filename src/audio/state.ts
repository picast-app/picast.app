import { Machine } from 'app/utils/state'

export type PlayState = 'paused' | 'waiting' | 'playing'

export default () => {
  const sm = new Machine<PlayState>('paused')
  sm.addTransition('paused', 'waiting')
  sm.addTransition('waiting', 'playing')
  sm.addTransition('playing', 'paused')
  sm.addTransition('playing', 'waiting')
  sm.addTransition('waiting', 'paused')
  return sm
}
