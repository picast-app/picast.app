import React from 'react'
import styled from 'styled-components'
import { Artwork, PlayButton } from 'components/atoms'
import { Shownotes } from 'components/composite'
import { useAPICall, useThemeRef } from 'utils/hooks'
import { useEpisodeToggle } from 'utils/playerHooks'

export const Core: React.FC<{ id: EpisodeId }> = ({ id }) => {
  const [podcast] = useAPICall('podcast', id[0])
  const [episode] = useAPICall('episodeInfo', id)
  const themeRef = useThemeRef(podcast?.palette)
  const [playing, toggle] = useEpisodeToggle(id)

  logger.info(episode)

  if (!podcast) return null
  return (
    <S.Container ref={themeRef}>
      <S.Podcast>
        <Artwork covers={podcast.covers} />
        <div>
          <address>{podcast.title}</address>
          <span>timestamp</span>
        </div>
      </S.Podcast>
      <S.Title>{episode?.title}</S.Title>
      <S.Actions>
        <PlayButton playing={playing} onPress={toggle} />
      </S.Actions>
      <Shownotes>{episode?.shownotes}</Shownotes>
    </S.Container>
  )
}

const S = {
  Container: styled.article`
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
  `,

  Podcast: styled.div`
    display: flex;

    picture {
      width: 3rem;
      border-radius: 0.2rem;
      overflow: hidden;
      margin-right: 1rem;
    }

    & > div {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
    }

    address {
      color: var(--cl-primary);
    }

    span {
      font-size: 0.8rem;
    }
  `,

  Title: styled.h1`
    font-size: 1.3rem;
    margin: 1.5rem 0;
    line-height: 1.3;
    color: var(--cl-strong);
  `,

  Actions: styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding: 0.2rem 0;
    margin: 0 -1rem;
    margin-bottom: 1.5rem;
    border-top: 1px solid var(--cl-border);
    border-bottom: 1px solid var(--cl-border);
  `,
}
