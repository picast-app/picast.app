import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { RouteProps, history } from '@picast-app/router'
import { animateTo } from 'utils/animate'
import { mobile, desktop } from 'styles/responsive'
import { useMatchMedia } from 'utils/hooks'
import { GestureController, VerticalSwipe } from 'interaction/gesture/gestures'
import { min } from 'utils/array'

const EpisodeInfo: React.FC<RouteProps> = ({ query }) => {
  const id = (query.info as string).split('-')
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const isMobile = useMatchMedia(mobile)

  const close = () => history.push({})

  const animated = isMobile ? ref : null
  useTransitionIn(animated)
  const transitionOut = useTransitionOut(animated, close)
  useSwipe(animated, close)

  return (
    <S.Shade ref={setRef} onClick={transitionOut}>
      <S.Container></S.Container>
    </S.Shade>
  )
}

export default EpisodeInfo

const useTransitionIn = (ref: HTMLDivElement | null) =>
  useEffect(() => {
    if (!ref) return
    animateTo(ref, { backgroundColor: '#0008' }, { duration: 200 })
    animateTo(
      ref.firstChild as any,
      { transform: `translateY(-${STOPS[1] * 100}vh)` },
      { duration: 200, easing: 'ease-out' }
    )
  }, [ref])

const useTransitionOut = (
  ref: HTMLDivElement | null,
  cb: () => void
) => async () => {
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

function useSwipe(ref: HTMLElement | null, _close: () => void) {
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

      gesture.addEventListener('move', dy => {
        el.style.transform = `translateY(${-(initial + dy)}px)`
      })

      gesture.addEventListener('end', async () => {
        const vel = Math.abs(gesture.velocity) > 3 ? gesture.velocity : 0
        const stops = STOPS.map(n => n * window.innerHeight)
        const pos = stops[0] - el.getBoundingClientRect().top

        const stop = min(
          vel ? stops.filter(n => (vel > 0 ? n < pos : n > pos)) : stops,
          n => Math.abs(n - pos)
        )

        await animateTo(
          el,
          { transform: `translateY(${-stop}px)` },
          { duration: 200, easing: 'ease' }
        )

        if (stop === stops[2]) close()
      })
    })

    return () => controller.stop()
  }, [ref, close])
}

const STOPS = [1, 0.8, 0]

const S = {
  Shade: styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 11000;
    background-color: #0000;
    will-change: transform;

    @media ${desktop} {
      backdrop-filter: blur(1px) brightness(0.5);
    }
  `,

  Container: styled.div`
    position: absolute;
    top: 100%;
    width: 100%;
    min-height: 100vh;
    background-color: var(--cl-surface);

    --border-radius: 0.5rem;
    border-radius: var(--border-radius);

    @media ${desktop} {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: clamp(35rem, 40vw, 50rem);
      max-width: 100vw;
      min-height: 25rem;
      max-height: 80vh;
    }

    @media ${mobile} {
      border-radius: none;
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
    }
  `,
}
