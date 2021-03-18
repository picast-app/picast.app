import React from 'react'
import styled from 'styled-components'
import { useHistory, useLocation } from 'utils/hooks'

export function EpisodeInfo() {
  const history = useHistory()
  useLocation()

  const info = new URLSearchParams(location.search).get('info')

  function close() {
    if ((history.location.state as any)?.previous) history.goBack()
    else history.push(location.pathname)
  }

  if (!info) return null
  return (
    <S.Shade onClick={close}>
      <S.Container></S.Container>
    </S.Shade>
  )
}

const S = {
  Container: styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    display: block;
    width: 30rem;
    height: 25rem;
    border-radius: 0.5rem;
    background-color: var(--cl-surface);
  `,

  Shade: styled.div`
    position: fixed;
    z-index: 1000;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(2px) saturate(80%);
    background-color: #0005;

    picast-player:not([hidden]) ~ & {
      height: calc(100vh - var(--player-height));
    }
  `,
}
