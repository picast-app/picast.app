import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { formatDuration, durAttr } from 'utils/time'
import { useVisibility, useCanvas } from 'utils/hooks'
import { usePlayState } from 'utils/player'

const audio = document.querySelector('#player') as HTMLAudioElement

export default function ProgressBar() {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, width, height] = useCanvas(canvasRef.current)
  const visibility = useVisibility()
  const visible = visibility === 'visible'
  const [playState] = usePlayState()
  const playing = playState === 'playing'

  useEffect(() => {
    if (!visible) return
    let lastT = audio.currentTime

    const onUpdate = ({ target }: Event) => {
      const t = (target as HTMLAudioElement).currentTime
      if ((t | 0) === (lastT | 0)) return
      setProgress(t)
      lastT = t
    }

    const onDuration = ({ target }: Event) => {
      setDuration((target as HTMLAudioElement).duration)
    }

    audio.addEventListener('timeupdate', onUpdate)
    audio.addEventListener('durationchange', onDuration)

    return () => {
      audio.removeEventListener('timeupdate', onUpdate)
      audio.removeEventListener('durationchange', onDuration)
    }
  }, [visible])

  useEffect(() => {
    if (!ctx || !visible) return

    let renderId: number
    let prog: number
    let lastRender: number
    const syncInterval = 30000

    const render = () => {
      const now = performance.now()
      if (!lastRender) lastRender = now
      const dt = now - lastRender
      lastRender = now

      if (
        prog === undefined ||
        ((now / syncInterval) | 0) !== (((now - dt) / syncInterval) | 0)
      )
        prog = audio.currentTime
      else prog += dt / 1000

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#f00'
      ctx.fillRect(0, 0, (prog / duration) * width, height)

      if (playing) renderId = requestAnimationFrame(render)
    }
    render()

    return () => window.cancelAnimationFrame(renderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, visible, width, height, duration, playing])

  return (
    <S.Wrap>
      <S.Time aria-label="progress" dateTime={durAttr(progress)}>
        {formatDuration(progress)}
      </S.Time>
      <S.Bar ref={canvasRef} />
      <S.Time
        aria-label="time remaining"
        dateTime={durAttr(duration - progress)}
      >
        {formatDuration(-(duration - progress))}
      </S.Time>
    </S.Wrap>
  )
}

const S = {
  Wrap: styled.div`
    width: 100%;
    position: relative;
  `,

  Bar: styled.canvas`
    height: 1rem;
    width: 100%;
  `,

  Time: styled.time`
    position: absolute;
    color: var(--cl-text);
    font-size: 0.8rem;
    top: calc(100% + 0.5rem);

    &:last-of-type {
      right: 0;
    }
  `,
}
