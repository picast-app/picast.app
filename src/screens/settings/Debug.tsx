import React from 'react'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useIDBState } from 'utils/hooks'

export default function Debug() {
  const [print, setPrint, loading] = useIDBState<boolean>('print_logs')

  if (loading) return null
  return (
    <Section>
      <span>dppx</span>
      <span>{devicePixelRatio}</span>
      <span>Concurrency</span>
      <span>{navigator.hardwareConcurrency}</span>
      <span>Print logs</span>
      <Switch checked={print ?? false} onChange={setPrint} />
    </Section>
  )
}
