import React from 'react'
import styled from 'styled-components'
import { Icon, Artwork } from 'components/atoms'
import Controls, { ControlsSC } from './Controls'
import { usePlaying } from 'utils/player'

interface Props {
  onHide(): void
}

export default function Fullscreen({ onHide }: Props) {
  const [podcast, episode] = usePlaying()

  return (
    <S.Fullscreen>
      <S.Main id="fullscreen-player">
        <S.Navigation>
          <Icon icon="arrow_down" onClick={onHide} label="minimize player" />
        </S.Navigation>
        <Artwork src={podcast.artwork} />
        <span>{episode.title}</span>
        <Controls />
      </S.Main>
    </S.Fullscreen>
  )
}

const S = {
  Fullscreen: styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 12000;
    pointer-events: none;

    &[data-state='visible']::before {
      content: '';
      background-color: var(--cl-background);
      position: absolute;
      top: var(--bar-height);
      height: 100%;
      left: 0;
      width: 100vw;
      z-index: -1;
    }
  `,

  Main: styled.div`
    background-color: var(--cl-background);
    opacity: 0;
    width: 100%;
    height: 100%;
    transform: translateY(var(--bar-height));
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;

    ${ControlsSC} {
      position: static;
      transform: unset;
      margin-bottom: 2rem;
    }
  `,

  Navigation: styled.div`
    display: flex;
    align-items: center;
    width: 100%;
  `,
}
