import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { formatDuration, durAttr } from 'utils/time'

const audio = document.querySelector('#player') as HTMLAudioElement

export default function ProgressBar() {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let lastT = 0

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
  }, [])

  console.log('render')

  return (
    <S.Wrap>
      <S.Time aria-label="progress" dateTime={durAttr(progress)}>
        {formatDuration(progress)}
      </S.Time>
      <S.Bar />
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
    --height: 0.5rem;

    height: var(--height);
    width: 100%;
    background: #f00;
    border-radius: calc(var(--height) / 2);
  `,

  Time: styled.time`
    position: absolute;
    color: var(--cl-text);
    font-size: 0.8rem;
    top: 150%;

    &:last-of-type {
      right: 0;
    }
  `,
}
