import React from 'react'
import styled from 'styled-components'
import { useStateX } from 'hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import { RouteProps, Redirect } from '@picast-app/router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'
import ContextMenu from './podcast/ContextMenu'

export default function Fake({ match: { id } }: RouteProps<{ id: string }>) {
  const [podcast] = useStateX('podcasts.*', id)

  logger.info({ podcast })

  if (podcast === null) return <Redirect to={`/404?pod=${id}`} />
  return (
    <Screen loading={podcast === undefined}>
      <Appbar title={podcast?.title} back="/">
        {podcast ? (
          <ContextMenu id={podcast.id} feed={(podcast as any).feed} />
        ) : undefined}
      </Appbar>
      <S.Inner selectColor={podcast?.palette?.muted}>
        <Info {...podcast} />
        {podcast && (
          // render after podcast is loaded so that initial batch of episodes
          // isn't refetched
          <Feed
            podcast={id}
            total={podcast?.episodeCount}
            onLoading={() => {}}
          />
        )}
      </S.Inner>
    </Screen>
  )
}

const S = {
  Inner: styled.div<{ selectColor?: string }>`
    --inner-width: 70rem;
    max-width: var(--inner-width);
    margin: auto;
  `,
}
