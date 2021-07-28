import React from 'react'
import styled from 'styled-components'
import { Artwork } from 'app/components/atoms'
import Controls from '../Controls'

type Props = { podcast: Podcast; episode: EpisodeMin }

export default function Player({ podcast, episode }: Props) {
  return (
    <S.Player>
      <Artwork
        src={podcast.artwork}
        title={podcast.title}
        covers={podcast.covers}
        sizes={[0.8 * window.innerWidth]}
      />
      <S.TitleWrap>
        <span>{episode.title}</span>
        <span>{podcast.title}</span>
      </S.TitleWrap>
      <S.CtrlWrap>
        <player-progress />
        <Controls round />
      </S.CtrlWrap>
    </S.Player>
  )
}

const S = {
  Player: styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-top: max(1rem, 3vh);
    padding-bottom: 5vh;

    picture {
      max-width: min(80vw, calc(0.5 * (100vh - 2rem)));
      border-radius: 0.5rem;
      overflow: hidden;
    }
  `,

  TitleWrap: styled.div`
    max-width: 90vw;
    pointer-events: none;

    span {
      display: block;
      color: var(--cl-text-strong);
      text-align: center;
    }

    span:first-of-type {
      font-size: 1.2rem;
      line-height: 1.2;
    }

    span:last-of-type {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 0.7em;
    }
  `,

  CtrlWrap: styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    player-progress {
      width: 90%;
      margin-bottom: 3vh;
      z-index: 1000;
    }

    & > *:last-child {
      transform: scale(1.5);

      & > *:nth-child(2) {
        transform: scale(0.9);
      }
    }
  `,
}
