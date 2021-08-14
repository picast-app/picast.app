type Audio = import('./audio.comp').default

declare namespace JSX {
  interface IntrinsicElements {
    'picast-player': HTMLAttributes<HTMLElement>
    'player-progress': HTMLAttributes<HTMLElement>
    'picast-audio': HTMLAttribute<HTMLElement>
  }
}
