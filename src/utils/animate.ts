import debounce from 'lodash/debounce'

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

export async function scrollTo(element: HTMLElement, opts: ScrollToOptions) {
  logger.info('scroll')
  return new Promise<void>(res => {
    const onScroll = debounce(
      () => {
        element.removeEventListener('scroll', onScroll)
        res()
      },
      50,
      { leading: false, trailing: true }
    )
    element.addEventListener('scroll', onScroll)
    element.scrollTo(opts)
  })
}
