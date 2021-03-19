import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAPICall, useTheme } from 'utils/hooks'
import { Screen } from 'components/structure'
import Appbar from 'components/Appbar'
import type { RouteComponentProps } from 'react-router'
import Info from './podcast/Info'
import Feed from './podcast/Episodes'
import ContextMenu from './podcast/ContextMenu'
import type { Podcast as PodType } from 'main/store/types'

export default function Podcast({
  match,
}: RouteComponentProps<{ id: string }>) {
  const id = match.params.id.split('?')[0]
  const [podcast, _loading] = useAPICall('podcast', id)
  const [loading, setLoading] = useState(_loading)
  useCustomTheme(podcast?.palette)

  useEffect(() => {
    if (_loading) return setLoading(true)
    setLoading(podcast?.incomplete ?? false)
  }, [_loading, podcast?.incomplete])

  return (
    <Screen loading={loading}>
      <Appbar title={podcast?.title} back="/">
        {podcast ? (
          <ContextMenu id={podcast?.id} feed={(podcast as any).feed} />
        ) : undefined}
      </Appbar>
      <S.Inner>
        <Info {...podcast} />
        <Feed
          id={id}
          total={podcast ? podcast.episodeCount : -1}
          onLoading={setLoading}
        />
      </S.Inner>
    </Screen>
  )
}

function useCustomTheme(
  {
    darkVibrant: dark,
    lightVibrant: light,
  }: Exclude<PodType['palette'], undefined> = {} as any
) {
  const theme = useTheme()

  useEffect(() => {
    if (!dark || !light) return

    document.body.style.setProperty(
      '--cl-primary',
      theme === 'light' ? dark : light
    )

    return () => {
      document.body.style.removeProperty('--cl-primary')
    }
  }, [dark, light, theme])
}

const S = {
  Inner: styled.div`
    --inner-width: 70rem;
    max-width: var(--inner-width);
    margin: auto;
  `,
}
