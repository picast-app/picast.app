import { debounce } from 'utils/function'

export function animateTo(
  element: HTMLElement,
  keyframes: Parameters<Animatable['animate']>[0],
  options: Parameters<Animatable['animate']>[1],
  cb?: () => void
) {
  return new Promise<void>(res => {
    const anim = element.animate(keyframes, {
      ...(typeof options === 'object' && options),
      fill: 'both',
    })
    anim.addEventListener('finish', () => {
      const a = anim as any
      a.commitStyles?.()
      a.cancel()
      cb?.()
      res()
    })
  })
}

export async function scrollTo(element: HTMLElement, opts: ScrollToOptions) {
  return new Promise<void>(res => {
    const onScroll = debounce(() => {
      element.removeEventListener('scroll', onScroll)
      res()
    }, 50)
    element.addEventListener('scroll', onScroll)
    element.scrollTo(opts)
  })
}
