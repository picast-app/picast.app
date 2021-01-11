import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Artwork, Button } from 'components/atoms'
import { ArtworkShowcase } from 'components/composite'
import { lineClamp } from 'styles/mixin'
import { desktop } from 'styles/responsive'
import { useMatchMedia, useSubscriptions } from 'utils/hooks'
import ContextMenu from './ContextMenu'
import type * as T from 'gql/types'

export default function Info({
  id,
  title,
  author,
  artwork,
  description,
  feed,
}: Partial<T.PodcastPage_podcast>) {
  const [showDescription, setShowDescription] = useState(false)
  const isDesktop = useMatchMedia(desktop)
  const [subscriptions, subscribe, unsubscribe] = useSubscriptions()
  const [showcaseArt, setShowcaseArt] = useState(false)

  if (!id) return null

  const actions = (
    <S.Actions>
      <ContextMenu feed={feed} />
      {subscriptions?.includes(id) ? (
        <Button onClick={() => unsubscribe(id)} text>
          subscribed
        </Button>
      ) : (
        <Button onClick={() => subscribe(id)}>Subscribe</Button>
      )}
      <Icon
        icon={`expand_${showDescription ? 'less' : 'more'}` as any}
        onClick={() => setShowDescription(!showDescription)}
        label="show description"
      />
    </S.Actions>
  )
  return (
    <S.Info>
      <S.Head>
        <div>
          <S.TitleRow>
            <h1>{title}</h1>
            {isDesktop && actions}
          </S.TitleRow>
          <span>{author}</span>
          {isDesktop && <S.Description>{description}</S.Description>}
        </div>
        <Artwork src={artwork as string} onClick={() => setShowcaseArt(true)} />
      </S.Head>
      {!isDesktop && actions}
      {showDescription && <S.Description>{description}</S.Description>}
      {showcaseArt && (
        <ArtworkShowcase
          src={artwork as string}
          onClose={() => setShowcaseArt(false)}
        />
      )}
    </S.Info>
  )
}

const S = {
  Info: styled.div`
    border-bottom: 1px solid var(--cl-text-disabled);
    padding: 1rem;

    @media ${desktop} {
      border-bottom: none;
    }
  `,

  Head: styled.div`
    display: flex;
    justify-content: space-between;

    & > div {
      width: 100%;
    }

    img {
      height: 7rem;
      width: 7rem;
      border-radius: 0.5rem;
      margin-left: 1rem;
      cursor: zoom-in;
    }

    @media ${desktop} {
      flex-direction: row-reverse;
      justify-content: flex-end;

      img {
        margin-left: 0;
        margin-right: 1rem;
        height: 12rem;
        width: 12rem;
      }
    }
  `,

  TitleRow: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    h1 {
      font-size: 1.3rem;
      line-height: 1.4;
      margin-top: 0.2rem;
      ${lineClamp(2)}
    }
  `,

  Actions: styled.div`
    display: flex;
    justify-content: flex-start;
    margin-top: 1rem;
    align-items: center;

    & > :last-child {
      margin-left: auto;
    }

    @media ${desktop} {
      margin-top: 0;

      & > :last-child {
        display: none;
      }
    }
  `,

  Description: styled.p`
    color: var(--cl-text);
    margin-top: 1rem;
    font-size: 0.9rem;
  `,
}
