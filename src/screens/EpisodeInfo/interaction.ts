import { useEffect, useCallback } from 'react'
import { animateTo } from 'utils/animate'
import { GestureController, VerticalSwipe } from 'interaction/gesture/gestures'
import { min } from 'utils/array'
import { clamp } from 'utils/math'

export const useTransitionIn = (ref: HTMLDivElement | null) =>
  useEffect(() => {
    if (!ref) return
    animateTo(ref, { backgroundColor: '#0008' }, { duration: 200 })
    animateTo(
      ref.firstChild as any,
      { transform: `translateY(-${STOPS[1] * 100}vh)` },
      { duration: 200, easing: 'ease-out' }
    )
  }, [ref])

export const useTransitionOut =
  (ref: HTMLDivElement | null, cb: () => void) => async () => {
    if (!ref) return cb()
    await Promise.all([
      animateTo(ref, { backgroundColor: '#0000' }, { duration: 200 }),
      animateTo(
        ref.firstChild as any,
        { transform: 'translateY(0)' },
        { duration: 200, easing: 'ease-in' }
      ),
    ])
    cb()
  }

export function useSwipe(ref: HTMLElement | null, _close: () => void) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const close = useCallback(_close, [])

  useEffect(() => {
    if (!ref) return

    const toucharea = document.createElement('div')
    toucharea.style.position = 'fixed'
    toucharea.style.top = '0px'
    toucharea.style.left = '0px'
    toucharea.style.width = '100vw'
    toucharea.style.height = '100vh'

    const controller = new GestureController(VerticalSwipe, toucharea)
    controller.start()

    controller.addEventListener('start', gesture => {
      const el = ref.firstElementChild as HTMLElement
      const initial = el.offsetTop - el.getBoundingClientRect().top
      const content = ref.querySelector<HTMLElement>('.content')!
      let anchor = 0

      gesture.addEventListener('move', dy => {
        if (ref.dataset.anchor === 'top') {
          if (content.scrollTop > 0) {
            anchor = dy
            return
          } else ref.dataset.anchor = 'free'
        }
        const pos = clamp(0, initial + (dy - anchor), window.innerHeight)
        if (pos === window.innerHeight) ref.dataset.anchor = 'top'
        el.style.transform = `translateY(${-pos}px)`
      })

      gesture.addEventListener('end', async () => {
        if (content.scrollTop > 0) return
        const vel = Math.abs(gesture.velocity) > 3 ? gesture.velocity : 0
        const stops = STOPS.map(n => n * window.innerHeight)
        const pos = stops[0] - el.getBoundingClientRect().top

        let stop = min(
          vel ? stops.filter(n => (vel > 0 ? n < pos : n > pos)) : stops,
          n => Math.abs(n - pos)
        )
        if (vel === 0 && stops.includes(pos)) stop = pos

        if (stop !== pos)
          await animateTo(
            el,
            { transform: `translateY(${-stop}px)` },
            { duration: 200, easing: 'ease' }
          )

        if (stop === stops[2]) close()
        if (stop === stops[0]) ref.dataset.anchor = 'top'
      })
    })

    return () => controller.stop()
  }, [ref, close])
}

const STOPS = [1, 0.8, 0]
