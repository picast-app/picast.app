import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'components/atoms'
import { Shownotes } from 'components/composite'
import { useHistory, useLocation, useCustomTheme } from 'utils/hooks'
import { main } from 'workers'

export function EpisodeInfo() {
  const history = useHistory()
  useLocation()
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const id = new URLSearchParams(location.search).get('info')?.split('-') as
    | EpisodeId
    | undefined

  const info = useInfo(id)

  function close() {
    if ((history.location.state as any)?.previous) history.goBack()
    else history.push(location.pathname)
  }

  useCustomTheme(info?.podcast?.palette, ref)

  return (
    <S.Shade onClick={close} hidden={!id}>
      <S.Container onClick={e => e.stopPropagation()} ref={setRef}>
        {info && (
          <>
            <h1>{info.title}</h1>
            <address>
              <Link to={`/show/${info.podcast.id}`}>{info.podcast.title}</Link>
            </address>
            <S.NoteContainer>
              <Shownotes>{info.shownotes}</Shownotes>
            </S.NoteContainer>
          </>
        )}
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
  Container: styled.article`
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
    padding: 1rem;

    *[hidden] > & {
      transform: scale(0.8) translateX(-50%) translateY(-50%);
      transition-timing-function: ease-in;
    }

    h1 {
      color: var(--cl-text-strong);
      font-size: 1.41rem;
      font-weight: 300;
      line-height: 1.2;
      margin-bottom: 0.4em;
    }

    address {
      a {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--cl-primary);
        text-decoration: none;
      }
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

  NoteContainer: styled.div`
    max-height: 50vh;
    overflow: hidden auto;
    margin-top: 2rem;
  `,
}
