import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAPICall, useCustomTheme } from 'hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteProps } from '@picast-app/router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'
import ContextMenu from './podcast/ContextMenu'
import { main } from 'workers'

const checked: string[] = []

export default function Podcast({ match: { id } }: RouteProps<{ id: string }>) {
  const [podcast, _loading] = useAPICall('podcast', id)
  const [feedLoading, setFeedLoading] = useState(podcast?.incomplete ?? false)
  useCustomTheme(podcast?.palette)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (podcast?.incomplete !== undefined) setFeedLoading(podcast?.incomplete)
  }, [podcast?.incomplete])

  useEffect(() => {
    if (
      checked.includes(id) ||
      _loading ||
      process.env.NODE_ENV === 'development'
    )
      return
    setFetching(true)
    checked.push(id)
    main.fetchEpisodes(id).then(() => setFetching(false))
  }, [id, _loading])

  const loading = _loading || feedLoading || fetching

  return (
    <Screen loading={loading}>
      <Appbar title={podcast?.title} back="/">
        {podcast ? (
          <ContextMenu id={podcast?.id} feed={(podcast as any).feed} />
        ) : undefined}
      </Appbar>
      <S.Inner selectColor={podcast?.palette?.muted}>
        <Info {...podcast} />
        <Feed
          podcast={id}
          total={podcast?.episodeCount}
          onLoading={setFeedLoading}
        />
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
