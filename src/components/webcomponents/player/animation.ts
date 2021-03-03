export const transitionStates: {
  [k in 'fullscreen' | 'bar' | 'nav']: PropertyIndexedKeyframes
}[] = [
  {
    fullscreen: { transform: 'translateY(0)' },
    bar: { transform: 'translateY(0)' },
    nav: { transform: 'translateY(0)' },
  },
  {
    fullscreen: {
      transform: 'translateY(calc(-1 * var(--player-height)))',
    },
    bar: {
      transform:
        'translateY(calc((100vh - var(--bar-height) - var(--player-height)) * -1))',
    },
    nav: {
      transform: 'translateY(100%)',
    },
  },
]
