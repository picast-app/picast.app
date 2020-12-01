import React from 'react'
import styled from 'styled-components'
import { Icon, Artwork } from 'components/atoms'
import Controls, { ControlsSC } from './Controls'
import { usePlaying } from 'utils/player'
import Progress from './ProgressBar'

interface Props {
  onHide(): void
}

export default function Fullscreen({ onHide }: Props) {
  const [podcast, episode] = usePlaying()

  return (
    <S.Fullscreen>
      <S.Main id="fullscreen-player">
        <S.Background background={podcast.artwork ?? undefined} />
        <S.Navigation>
          <Icon icon="arrow_down" onClick={onHide} label="minimize player" />
        </S.Navigation>
        <Artwork src={podcast.artwork} />
        <span>{episode.title}</span>
        <Progress />
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
    position: relative;
    background-color: var(--cl-surface-alt);
    opacity: 0;
    width: 100%;
    height: 100%;
    transform: translateY(var(--bar-height));
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;

    --cl-text: var(--cl-text-alt);
    color: var(--cl-text);

    ${ControlsSC} {
      position: static;
      transform: unset;
      margin-bottom: 2rem;

      svg {
        fill: var(--cl-surface-alt);
      }
    }
  `,

  Background: styled.div<{ background?: string }>`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;

    background-image: url('${({ background }) => background}');
    background-size: cover;
    background-position: center;
    opacity: 0.25;
    filter: blur(80px) brightness(30%) saturate(150%);
  `,

  Navigation: styled.div`
    display: flex;
    align-items: center;
    width: 100%;
  `,
}
