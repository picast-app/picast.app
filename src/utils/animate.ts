export function animateTo(
  element: HTMLElement,
  keyframes: Parameters<Animatable['animate']>[0],
  options: Parameters<Animatable['animate']>[1],
  cb?: () => void
) {
  const anim = element.animate(keyframes, {
    ...(typeof options === 'object' && options),
    fill: 'both',
  })
  anim.addEventListener('finish', () => {
    const a = anim as any
    a.commitStyles?.()
    a.cancel()
    cb?.()
  })
}
