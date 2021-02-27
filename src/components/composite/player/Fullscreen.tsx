import React from 'react'
import styled from 'styled-components'
import { Icon, Artwork } from 'components/atoms'
import Controls, { ControlsSC } from './Controls'
import Progress from './ProgressBar'
import { usePlaying } from 'utils/player'
import { useMatchMedia } from 'utils/hooks'
import { desktop } from 'styles/responsive'

interface Props {
  onHide(): void
}

export default function Fullscreen({ onHide }: Props) {
  const [podcast, episode] = usePlaying()
  const isDesktop = useMatchMedia(desktop)

  if (isDesktop) return null
  return (
    <S.Fullscreen>
      <S.Main id="fullscreen-player">
        <S.Background background={podcast?.artwork ?? undefined} />
        <S.Navigation>
          <Icon icon="arrow_down" onClick={onHide} label="minimize player" />
        </S.Navigation>
        <S.Content>
          <S.Info>
            <Artwork src={podcast?.artwork} />
            <span>{episode?.title}</span>
            <span>{podcast?.title}</span>
          </S.Info>
          <Progress />
          <Controls />
        </S.Content>
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
    --cl-icon: #fff !important;

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
      margin: 1rem 0;

      button {
        transform: scale(1.3);
      }

      & > button {
        margin: 0 15vmin;
        transform: scale(1.7);

        & > svg {
          fill: var(--cl-surface-alt);
        }
      }
    }
  `,

  Content: styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    flex-grow: 1;
  `,

  Info: styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      margin-bottom: 1rem;
      width: 90vw;
      max-width: 40vh;
      border-radius: 0.5rem;
    }

    span:last-of-type {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 0.7rem;
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
    justify-self: flex-start;
  `,
}
