import React, { useState, useEffect, useReducer, useRef } from 'react'
import styled from 'styled-components'
import { SnackBar } from 'components/composite'
import { desktop } from 'styles/responsive'
import { animateTo } from 'utils/animate'
import { clamp } from 'utils/math'

export type Snack = {
  text: string
  action?: string
  timeout?: number
  actionEvent?: string
  lvl?: 'error' | 'info'
}

type QueueAction = { type: 'push'; snack: Snack } | { type: 'shift' }

export function SnackTray() {
  const [queue, set] = useReducer(
    (c: Snack[], a: QueueAction) =>
      a.type === 'push' ? [...c, a.snack] : a.type === 'shift' ? c.slice(1) : c,
    []
  )
  const [snack, setSnack] = useState<Snack>()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMsg: any = (e: CustomEvent<EchoSnackEvent['detail']>) => {
      const { text, action, actionEvent, lvl, ...snack } = e.detail
      let timeout: number | undefined = 4000
      if (typeof snack.timeout === 'number')
        timeout =
          clamp(4, snack.timeout / (snack.timeout >= 500 ? 1000 : 1), 10) * 1000
      if (snack.timeout === 'never') timeout = undefined
      set({ type: 'push', snack: { text, action, actionEvent, timeout, lvl } })
    }

    window.addEventListener('echo_snack', onMsg)

    return () => window.removeEventListener('echo_snack', onMsg)
  }, [])

  useEffect(() => {
    if (snack || !queue.length) return
    setSnack(queue[0])
    set({ type: 'shift' })
  }, [queue, snack])

  useEffect(() => {
    const container = ref.current?.firstChild as HTMLDivElement
    const clear: (() => void)[] = []
    const clearAll = () => {
      clear.forEach(func => func())
    }
    if (container) {
      container.scrollBy({ left: window.innerWidth })
      const onScroll = (e: any) => {
        const target: HTMLElement = e.target
        if (
          target.scrollLeft === 0 ||
          target.scrollLeft + target.offsetWidth === target.scrollWidth
        ) {
          clearAll()
          setSnack(undefined)
        }
      }
      container.addEventListener('scroll', onScroll)
      clear.push(() => container?.removeEventListener('scroll', onScroll))
    }
    if (snack?.timeout) {
      const toId = setTimeout(() => {
        const remove = () => setSnack(undefined)
        const el = Array.from(
          ref.current?.firstChild?.childNodes as any
        )[1] as HTMLElement
        if (!el) return remove()
        animateTo(
          el,
          { transform: 'scale(0.7)', opacity: 0 },
          { duration: 100, easing: 'ease-in' },
          remove
        )
      }, snack.timeout)
      clear.push(() => clearTimeout(toId))
    }
    return clearAll
  }, [snack])

  return (
    <S.Container ref={ref}>
      {snack && (
        <S.Slider>
          <S.ScrollStop />
          <SnackBar
            text={snack.text}
            action={snack.action}
            onAction={() => {
              if (!snack.actionEvent) return
              window.dispatchEvent(new CustomEvent(snack.actionEvent))
            }}
            lvl={snack.lvl}
          />
          <S.ScrollStop />
        </S.Slider>
      )}
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    position: fixed;
    left: 0;
    --bottom: var(--bar-height);
    bottom: var(--bottom);
    width: 100vw;
    display: flex;
    flex-direction: column-reverse;

    picast-player:not([hidden]) ~ & {
      bottom: calc(var(--bottom) + var(--player-height));
    }

    @media ${desktop} {
      max-width: 20rem;
      left: unset;
      right: 2rem;
      --bottom: 2rem;
    }
  `,

  Slider: styled.div`
    width: 100vw;
    overflow-x: auto;
    display: flex;
    scroll-snap-type: x mandatory;
    scroll-snap-stop: always;

    &::-webkit-scrollbar {
      display: none;
    }

    @media ${desktop} {
      display: contents;
    }

    & > * {
      scroll-snap-align: center;
      flex-shrink: 0;
      scroll-snap-stop: always;
    }
  `,

  ScrollStop: styled.div`
    display: block;
    width: 100vw;
  `,
}
