import React from 'react'
import styled from 'styled-components'
import { Artwork, PlayButton } from 'components/atoms'
import { Shownotes } from 'components/composite'
import { useThemeRef, useEpisodeToggle, useStateX } from 'hooks'
import { mobile, desktop } from 'styles/responsive'

export const Core: React.FC<{ id: EpisodeId }> = ({ id }) => {
  const [podcast] = useStateX('podcasts.*', id[0])
  const [episode] = useStateX('episodes.*.*', ...id)
  const themeRef = useThemeRef(podcast?.palette)
  const [playing, toggle] = useEpisodeToggle(id)

  if (!podcast) return null
  return (
    <S.Container ref={themeRef} className="content">
      <S.Podcast>
        <Artwork covers={podcast.covers} />
        <div>
          <S.Title>{episode?.title}</S.Title>
          <address>{podcast.title}</address>
          <span>timestamp</span>
        </div>
      </S.Podcast>
      <S.Title>{episode?.title}</S.Title>
      <S.Actions>
        <PlayButton playing={playing} onPress={toggle} round />
      </S.Actions>
      <Shownotes id={id} className="notes" />
    </S.Container>
  )
}

const S = {
  Container: styled.article`
    padding: 1rem;
    height: 100%;
    max-height: inherit;
    display: flex;
    flex-direction: column;

    *[data-anchor='top'] & {
      overflow-y: auto;
    }

    @media ${desktop} {
      .notes {
        flex-grow: 1;
        margin: 0 -1rem -1rem -1rem;
        padding: 0 1rem 1rem 1rem;
        overflow-x: hidden;
        overflow-y: auto;
      }
    }
  `,

  Podcast: styled.div`
    display: flex;
    --thumb-size: 3rem;

    picture {
      width: var(--thumb-size);
      height: var(--thumb-size);
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

    @media ${mobile} {
      h1,
      span {
        display: none;
      }
    }

    @media ${desktop} {
      --thumb-size: 8rem;

      & ~ h1 {
        display: none;
        margin-top: 1.5rem;
      }
    }
  `,

  Title: styled.h1`
    font-size: 1.3rem;
    line-height: 1.3;
    color: var(--cl-strong);
  `,

  Actions: styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding: 0.2rem 0;
    margin: 0 -1rem;
    margin: 1.5rem 0;
    border-top: 1px solid var(--cl-border);
    border-bottom: 1px solid var(--cl-border);
  `,
}
