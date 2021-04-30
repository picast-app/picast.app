import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { RouteProps, history } from '@picast-app/router'
import { animateTo } from 'utils/animate'

const EpisodeInfo: React.FC<RouteProps> = ({ query }) => {
  const id = (query.info as string).split('-')
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useTransitionIn(ref)
  const close = useTransitionOut(ref, () => history.push({}))

  return (
    <S.Shade ref={setRef} onClick={close}>
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
      { transform: 'translateY(-80vh)' },
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
  `,

  Container: styled.div`
    position: absolute;
    top: 100%;
    width: 100%;
    min-height: 100vh;
    background-color: var(--cl-surface);
  `,
}
