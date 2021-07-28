import React, { useState } from 'react'
import styled from 'styled-components'
import { Icon, Artwork, Button } from 'app/components/atoms'
import { ArtworkShowcase } from 'app/components/composite'
import { Dialog } from 'app/components/structure'
import { lineClamp } from 'app/styles/mixin'
import { desktop, mobile } from 'app/styles/responsive'
import { useMatchMedia, useStateX } from 'app/hooks'
import ContextMenu, { SC as CM } from './ContextMenu'
import { main } from 'app/workers'
import type { Podcast } from 'app/store/state'

export default function Info(podcast: Partial<Podcast>) {
  const [showDescription, setShowDescription] = useState(false)
  const isDesktop = useMatchMedia(desktop)
  const [showcaseArt, setShowcaseArt] = useState(false)
  const [wpSubs] = useStateX('user.wpSubs')
  const [msgSignIn, setMsgSignIn] = useState(false)

  if (!podcast?.id) return <S.Info />

  const wpActive = wpSubs?.includes(podcast.id!)

  async function toggleNotifications() {
    if (!podcast.id) return
    if (wpActive) await main.disablePushNotifications(podcast.id)
    else await main.enablePushNotifications(podcast.id)
  }

  async function toggleSub() {
    if (!podcast.id) return
    if (
      !(await main[podcast.subscribed ? 'unsubscribe' : 'subscribe'](
        podcast.id
      ))
    )
      setMsgSignIn(true)
  }

  const actions = (
    <S.Actions>
      <Button onClick={toggleSub} text={podcast.subscribed}>
        {podcast.subscribed ? 'subscribed' : 'subscribe'}
      </Button>
      <ContextMenu id={podcast.id} feed={(podcast as any).feed} />
      {podcast.subscribed && (
        <Icon
          icon={
            `bell_${
              wpSubs?.includes(podcast.id!) ? 'active' : 'inactive'
            }` as const
          }
          label={`${wpActive ? 'disable' : 'enable'} push notifications`}
          onClick={toggleNotifications}
        />
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
        <Artwork
          src={podcast.artwork}
          covers={podcast.covers}
          onClick={() => setShowcaseArt(true)}
          sizes={[[mobile, mobileCoverSize], desktopCoverSize]}
        />
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
          covers={podcast.covers ?? undefined}
          onClose={() => setShowcaseArt(false)}
        />
      )}
      <Dialog open={msgSignIn} onClose={() => setMsgSignIn(false)}>
        <p>
          Please sign in or create an account to subscribe to{' '}
          {podcast?.title ?? 'this podcast'}.
        </p>
      </Dialog>
    </S.Info>
  )
}

const mobileCoverSize = 7 * 16
const desktopCoverSize = 12 * 16

const S = {
  Info: styled.div`
    border-bottom: 1px solid var(--cl-text-disabled);

    --padding: 1rem;
    --height: ${mobileCoverSize}px;
    --action-height: 2rem;

    padding: var(--padding);
    min-height: calc(var(--height) + 2 * var(--padding));
    width: 100%;

    @media ${desktop} {
      border-bottom: none;
      --height: ${desktopCoverSize}px;
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

    & > :first-child {
      margin-right: auto;
    }

    & > button[data-style~='icon-wrap'] {
      opacity: 0.9;

      &:not(:last-of-type) {
        transform: scale(0.9);
      }
    }

    @media ${desktop} {
      margin-top: 0;
      margin-right: 1.5rem;

      & > :last-child {
        display: none;
      }
    }

    & > ${CM} {
      margin: 0 1rem;

      @media ${mobile} {
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
