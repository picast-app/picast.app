import React from 'react'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useIDBState, useAppState } from 'utils/hooks'
import { main } from 'workers'
import type { State } from 'main/appState'

export default function Debug() {
  const [print, setPrint, loading] = useIDBState<boolean>('print_logs')
  const [debug, stateLoading] = useAppState<State['debug']>('debug')

  if (loading || stateLoading) return null
  return (
    <Section>
      <span>dppx</span>
      <span>{devicePixelRatio}</span>
      <span>Concurrency</span>
      <span>{navigator.hardwareConcurrency}</span>
      <span>Print logs</span>
      <Switch checked={print ?? false} onChange={setPrint} />
      <span>Render touch paths</span>
      <Switch
        checked={debug?.touch}
        onChange={touch => main.updateDebug({ touch })}
      />
    </Section>
  )
}
