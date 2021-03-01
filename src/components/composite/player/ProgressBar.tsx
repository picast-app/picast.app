import React, { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { formatDuration, durAttr } from 'utils/time'
import { useVisibility, useCanvas } from 'utils/hooks'
// import { usePlayState } from 'utils/player'

const audio = document.querySelector('#player') as HTMLAudioElement

interface Props {
  barOnly?: boolean
}

export default function ProgressBar({ barOnly = false }: Props) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, width, height] = useCanvas(canvasRef.current)
  const visibility = useVisibility()
  const visible = visibility === 'visible'
  // const playState = usePlayState()
  const playState = 'paused' as string
  const playing = playState === 'playing'
  const [seekKey, setSeekKey] = useState<any>()
  const [manualProg, setManualProg] = useState(false)
  const padd = barOnly ? 0 : (16 * devicePixelRatio) / 2

  useEffect(() => {
    if (!visible || manualProg) return
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
  }, [visible, manualProg])

  function jumpTo(location: number) {
    audio.addEventListener('seeked', setSeekKey, { once: true })
    window.dispatchEvent(
      new CustomEvent<EchoJumpEvent['detail']>('echo_jump', {
        detail: { location },
      })
    )
  }

  function drag({
    pageX,
    target,
  }: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!ctx) return
    setManualProg(true)
    const p = padd / devicePixelRatio
    const box = (target as HTMLCanvasElement).getBoundingClientRect()
    const progLabel = (target as HTMLElement).previousSibling as HTMLTimeElement
    let lastLabel = progLabel?.innerHTML

    const jump = (msX: number, persist = false) => {
      const cx = Math.min(Math.max(msX, box.left + p), box.right - p) - p
      const pos = Math.min(
        Math.max((cx - box.left) / (box.width - p * 2), 0),
        1
      )
      if (!barOnly) {
        const label = formatDuration(pos * duration)
        if (label !== lastLabel) {
          progLabel.innerHTML = label
          lastLabel = label
        }
      }
      if (persist) jumpTo(pos * duration)
      else renderBar(ctx, width, height, padd, pos)
    }

    jump(pageX)
    document.documentElement.style.userSelect = 'none'

    const onMove = ({ pageX }: MouseEvent) => {
      jump(pageX)
    }

    const finalize = ({ pageX }: MouseEvent) => {
      jump(pageX, true)
      setManualProg(false)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.style.userSelect = 'initial'
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseup', finalize, { once: true })
  }

  // prettier-ignore
  const renderDeps = [
    ctx, visible, width, height, duration, playing, barHeight, padd, seekKey, 
    manualProg
  ]
  useEffect(() => {
    if (!ctx || !visible || manualProg) return

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

      renderBar(ctx, width, height, padd, prog / duration, !barOnly)
      if (playing) renderId = requestAnimationFrame(render)
    }

    render()
    return () => window.cancelAnimationFrame(renderId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, renderDeps)

  const bar = (
    <S.Bar
      ref={canvasRef}
      padd={barOnly ? 0 : padd / devicePixelRatio}
      onMouseDown={drag}
    />
  )
  if (barOnly) return bar
  return (
    <S.Wrap>
      <S.Time aria-label="progress" dateTime={durAttr(progress)}>
        {formatDuration(progress)}
      </S.Time>
      {bar}
      <S.Time
        aria-label="time remaining"
        dateTime={durAttr(duration - progress)}
      >
        {formatDuration(-(duration - progress))}
      </S.Time>
    </S.Wrap>
  )
}

const barHeight = 6 * devicePixelRatio

function renderBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padd: number,
  ratio: number,
  complex = true
) {
  const w = width - padd * 2
  const x0 = padd
  if (ratio === Infinity || isNaN(ratio)) ratio = 0

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#666'
  const progWidth = ratio * w

  const capOff = complex ? barHeight / 2 : 0

  // background strip
  ctx.fillRect(
    x0 + progWidth + capOff,
    height / 2 - barHeight / 2,
    w - progWidth - capOff * 2,
    barHeight
  )
  if (complex) {
    ctx.beginPath()
    ctx.arc(
      barHeight / 2 + x0,
      height / 2,
      barHeight / 2,
      -Math.PI / 2,
      Math.PI / 2,
      true
    )
    ctx.fill()
    ctx.beginPath()
    ctx.arc(
      w - barHeight / 2 + x0,
      height / 2,
      barHeight / 2,
      -Math.PI / 2,
      Math.PI / 2
    )
    ctx.fill()
  }

  if (ratio > 0) {
    // progress strip
    ctx.fillStyle = '#d32f2f'
    ctx.fillRect(
      capOff + x0,
      height / 2 - barHeight / 2,
      progWidth - capOff,
      barHeight
    )
    if (complex) {
      ctx.beginPath()
      ctx.arc(
        barHeight / 2 + x0,
        height / 2,
        barHeight / 2,
        -Math.PI / 2,
        Math.PI / 2,
        true
      )
      ctx.fill()
    }
  }

  if (!complex) return

  // progress knob
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(ratio * w + x0, height / 2, height / 2, 0, 2 * Math.PI)
  ctx.fill()
}

const S = {
  Wrap: styled.div`
    width: 100%;
    position: relative;
    margin-bottom: 1.3rem;
  `,

  Bar: styled.canvas<{ padd: number }>`
    height: ${({ padd }) => (padd ? '1rem' : '6px')};
    width: calc(100% + ${({ padd }) => padd}px * 2);
    transform: translateX(-${({ padd }) => padd}px);
    cursor: pointer;
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

export const ProgressSC = S.Wrap
