import React from 'react'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useIDBState } from 'utils/hooks'

export default function Debug() {
  const [print, setPrint, loading] = useIDBState<boolean>('print_logs')

  if (loading) return null
  return (
    <Section>
      <span>Print logs</span>
      <Switch checked={print ?? false} onChange={setPrint} />
    </Section>
  )
}
