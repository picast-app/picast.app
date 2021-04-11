import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAPICall, useCustomTheme } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'
import ContextMenu from './podcast/ContextMenu'
import { main } from 'workers'

const checked: string[] = []

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const id = match.params.id.split('?')[0]
  const [podcast, _loading] = useAPICall('podcast', id)
  const [feedLoading, setFeedLoading] = useState(podcast?.incomplete ?? false)
  useCustomTheme(podcast?.palette)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (podcast?.incomplete !== undefined) setFeedLoading(podcast?.incomplete)
  }, [podcast?.incomplete])

  useEffect(() => {
    if (checked.includes(id) || _loading) return
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
          id={id}
          total={podcast ? podcast.episodeCount : -1}
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
