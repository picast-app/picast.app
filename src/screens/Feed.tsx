import React, { useCallback } from 'react'
import styled from 'styled-components'
import { Screen, VirtualList } from 'components/structure'
import { EpisodeStrip } from 'components/composite'
import Appbar from 'components/Appbar'
import { center } from 'styles/mixin'
import { useAppState, useFeed } from 'hooks'
import { Link } from '@picast-app/router'

export default function Wrap() {
  return (
    <Screen>
      <Appbar title="Subscriptions"></Appbar>
      <Main />
    </Screen>
  )
}

function Main() {
  const [signedIn, loading] = useAppState<boolean>('user.signedIn')
  if (loading) return null
  if (!signedIn) return <Intro />
  return <Feed />
}

function Feed() {
  const feed = useFeed('*')

  const props = useCallback(
    (index: number) => ({ index, feed: feed!, artwork: true }),
    [feed]
  )

  if (!feed) return null
  return (
    <VirtualList length={10000} itemProps={props}>
      {EpisodeStrip}
    </VirtualList>
  )
}

function Intro() {
  return (
    <S.Intro>
      <span>
        {$`@feed.signed_out_msg_a`}
        <Link to="/signin">{$`@feed.signed_out_msg_link`}</Link>
        {$`@feed.signed_out_msg_b`}
      </span>
    </S.Intro>
  )
}

const S = {
  Intro: styled.div`
    ${center}
    width: 100%;
    padding: 1rem;
    text-align: center;

    span {
      font-size: 1.2rem;
      opacity: 0.8;
      line-height: 1.3;
    }
  `,
}
