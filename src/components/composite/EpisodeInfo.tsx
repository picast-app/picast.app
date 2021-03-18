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

  return (
    <S.Shade onClick={close} hidden={!info}>
      <S.Container onClick={e => e.stopPropagation()}></S.Container>
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
    transition: transform var(--td) ease-out;
    transform-origin: left top;

    *[hidden] > & {
      transform: scale(0.8) translateX(-50%) translateY(-50%);
      transition-timing-function: ease-in;
    }
  `,

  Shade: styled.div`
    position: fixed;
    z-index: 1000;
    width: 100vw;
    height: 100vh;

    --td: 0.2s;

    picast-player:not([hidden]) ~ & {
      height: calc(100vh - var(--player-height));
    }

    &[hidden] {
      display: initial;
      visibility: hidden;
      transition: visibility 0s var(--td);
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(1px) saturate(0.5) brightness(0.8);
      transition: backdrop-filter var(--td) ease;
    }

    &[hidden]::before {
      backdrop-filter: blur(0) saturate(1) brightness(1);
    }
  `,
}
