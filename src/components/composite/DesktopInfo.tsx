import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { EpisodeInfo } from './EpisodeInfo'
import { useHistory, useLocation, useCustomTheme } from 'utils/hooks'
import { main } from 'workers'

export function DesktopEpisodeInfo() {
  const id = new URLSearchParams(location.search).get('info')?.split('-') as
    | EpisodeId
    | undefined

  const history = useHistory()
  useLocation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const info = useInfo(id)
  useCustomTheme(info?.podcast?.palette, ref)

  function close() {
    if ((history.location.state as any)?.previous) history.goBack()
    else history.push(location.pathname)
  }

  return (
    <S.Shade onClick={close} hidden={!id} ref={setRef}>
      <S.Container>
        {info && <EpisodeInfo podcast={info.podcast} episode={info} />}
      </S.Container>
    </S.Shade>
  )
}

function useInfo(id?: EpisodeId) {
  const [info, setInfo] = useState<
    PromiseType<ReturnType<typeof main['episodeInfo']>>
  >()

  const [pod, ep] = id ?? []
  useEffect(() => {
    if (!pod || !ep) return

    let cancelled = false
    ;(async () => {
      const info = await main.episodeInfo([pod!, ep!])
      if (!cancelled) setInfo(info)
    })()

    return () => {
      cancelled = true
    }
  }, [pod, ep])

  return info
}

const S = {
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

  Container: styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    display: block;
    width: clamp(35rem, 40vw, 50rem);
    max-width: 100vw;
    min-height: 25rem;
    border-radius: 0.5rem;
    background-color: var(--cl-surface);
    transition: transform var(--td) ease-out;
    transform-origin: left top;

    *[hidden] > & {
      transform: scale(0.8) translateX(-50%) translateY(-50%);
      transition-timing-function: ease-in;
    }
  `,
}
