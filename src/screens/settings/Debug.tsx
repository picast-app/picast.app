import React, { useEffect } from 'react'
import Section from './Section'
import { Switch, Button } from 'components/atoms'
import { useStateX } from 'hooks/store'
import { stateToggle } from './util'
import { main } from 'workers'

export default function Debug() {
  const [state, { set }] = useStateX('settings.debug')
  usePlaybackLoading(state?.playbackLoading)

  if (!state) return null
  const toggle = stateToggle('settings.debug', state, set)
  return (
    <Section>
      <span>{$`@settings.dppx`}</span>
      <span>{devicePixelRatio}</span>
      <span>{$`@settings.concurrency`}</span>
      <span>{navigator.hardwareConcurrency}</span>
      <span>{$`@settings.print_logs`}</span>
      <Switch {...toggle('printLogs')} />
      <span>{$`@settings.show_touch`}</span>
      <Switch {...toggle('showTouchPaths')} />
      <span>{$`@settings.toggle_playback`}</span>
      <Switch {...toggle('playbackLoading')} />
      <span>{$`@settings.pull_pods`}</span>
      <Button
        onClick={() =>
          main.pullPodcasts({ meta: true, episodes: true, force: true })
        }
      >
        {$`@settings.pull`}
      </Button>
    </Section>
  )
}

function usePlaybackLoading(loading?: boolean) {
  useEffect(() => {
    if (loading === undefined) return
    for (const bar of [...document.querySelectorAll('picast-player')].flatMap(
      v => [...v.shadowRoot!.querySelectorAll('player-progress')]
    ))
      bar.setAttribute('loading', loading.toString())
  }, [loading])
}
