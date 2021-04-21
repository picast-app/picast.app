import React, { useState } from 'react'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useAppState } from 'utils/hooks'
import { main } from 'workers'
import type { State } from 'main/appState'

export default function Debug() {
  const [debug, loading] = useAppState<State['debug']>('debug')
  const [anim, setAnim] = useState(false)
  if (loading) return null
  const update = (field: string) => (v: any) => main.updateDebug({ [field]: v })
  return (
    <Section>
      <span>dppx</span>
      <span>{devicePixelRatio}</span>
      <span>Concurrency</span>
      <span>{navigator.hardwareConcurrency}</span>
      <span>Print logs</span>
      <Switch checked={debug?.print_logs} onChange={update('print_logs')} />
      <span>Render touch paths</span>
      <Switch checked={debug?.touch} onChange={update('touch')} />
      <span>Toggle playback loading</span>
      <Switch
        checked={anim}
        onChange={v => {
          setAnim(v)
          progressBars().forEach(el => {
            el.setAttribute('loading', v.toString())
          })
        }}
      ></Switch>
    </Section>
  )
}

const progressBars = () =>
  [...document.querySelectorAll('picast-player')].flatMap(v => [
    ...v.shadowRoot!.querySelectorAll('player-progress'),
  ])
