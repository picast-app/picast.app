import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Artwork, Button } from 'components/atoms'
import { ArtworkShowcase } from 'components/composite'
import { lineClamp } from 'styles/mixin'
import { desktop, mobile } from 'styles/responsive'
import { useMatchMedia, useSubscriptions } from 'utils/hooks'
import ContextMenu from './ContextMenu'
import type * as T from 'types/gql'

export default function Info(podcast: Partial<T.PodcastPage_podcast>) {
  const [showDescription, setShowDescription] = useState(false)
  const isDesktop = useMatchMedia(desktop)
  const [subscriptions, subscribe, unsubscribe] = useSubscriptions()
  const [showcaseArt, setShowcaseArt] = useState(false)

  if (!podcast?.id) return <S.Info />

  const actions = (
    <S.Actions>
      <ContextMenu feed={podcast.feed} />
      {subscriptions?.includes(podcast.id) ? (
        <Button onClick={() => unsubscribe(podcast.id!)} text>
          subscribed
        </Button>
      ) : (
        <Button onClick={() => subscribe(podcast.id!)}>Subscribe</Button>
      )}
      <Icon
        icon={`expand_${showDescription ? 'less' : 'more'}` as any}
        onClick={() => setShowDescription(!showDescription)}
        label="show description"
      />
    </S.Actions>
  )
  return (
    <S.Info data-view={showDescription ? 'expanded' : 'contained'}>
      <S.Head>
        <div>
          <S.TitleRow>
            <h1>{podcast.title}</h1>
            {isDesktop && actions}
          </S.TitleRow>
          <span>{podcast.author}</span>
          {isDesktop && <S.Description>{podcast.description}</S.Description>}
        </div>
        <Artwork src={podcast.artwork} onClick={() => setShowcaseArt(true)} />
      </S.Head>
      {!isDesktop && (
        <>
          {actions}
          <S.Description>{podcast.description}</S.Description>
        </>
      )}
      {showcaseArt && (
        <ArtworkShowcase
          src={podcast.artwork!}
          onClose={() => setShowcaseArt(false)}
        />
      )}
    </S.Info>
  )
}

const S = {
  Info: styled.div`
    border-bottom: 1px solid var(--cl-text-disabled);

    --padding: 1rem;
    --height: 7rem;
    --action-height: 2rem;

    padding: var(--padding);
    min-height: calc(var(--height) + 2 * var(--padding));
    width: 100%;

    @media ${desktop} {
      border-bottom: none;
      --height: 12rem;
    }

    @media ${mobile} {
      height: calc(var(--height) + 3 * var(--padding) + var(--action-height));

      &[data-view='expanded'] {
        height: unset;
      }
    }
  `,

  Head: styled.div`
    display: flex;
    justify-content: space-between;
    min-height: var(--height);

    & > div {
      width: 100%;
    }

    img {
      height: var(--height);
      width: var(--height);
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
    margin-top: var(--padding);
    align-items: center;
    height: var(--action-height);

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
    line-height: 1.5;

    @media ${mobile} {
      [data-view='contained'] & {
        display: none;
      }
    }
  `,
}
