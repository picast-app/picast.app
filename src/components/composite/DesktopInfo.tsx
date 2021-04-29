import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { EpisodeInfo } from './EpisodeInfo'
import { useCustomTheme } from 'utils/hooks'
import { main } from 'workers'
import {
  history,
  useLocation,
  SearchParams,
  RouteProps,
} from '@picast-app/router'

export const DesktopEpisodeInfo: React.FC<RouteProps> = ({ query }) => {
  const { search, previous } = useLocation()
  const id = (query.info as string).split('-') as EpisodeId | undefined
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const info = useInfo(id)
  useCustomTheme(info?.podcast?.palette, ref)

  function close() {
    if (previous) history.back()
    else history.push({ search: new SearchParams(search).remove('info') })
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

    picast-player:not([hidden]) ~ & {
      height: calc(100vh - var(--player-height));
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(1px) saturate(0.5) brightness(0.8);
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
    transform-origin: left top;

    *[hidden] > & {
      transform: scale(0.8) translateX(-50%) translateY(-50%);
      transition-timing-function: ease-in;
    }
  `,
}
