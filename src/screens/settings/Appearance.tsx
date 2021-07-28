import React from 'react'
import styled from 'styled-components'
import Section from './Section'
import { Switch } from 'app/components/atoms'
import { useStateX } from 'app/hooks/store'
import { stateToggle } from './util'

export default function Appearance() {
  const [state, { set }] = useStateX('settings.appearance')

  if (!state) return null
  const toggle = stateToggle('settings.appearance', state, set)
  return (
    <Section title={$.c`theme`}>
      <label htmlFor="mode">{$`@settings.pick_theme`}</label>
      <S.Select
        id="mode"
        name="Theme"
        value={state.colorTheme}
        disabled={state.useSystemTheme}
        onChange={({ target }) =>
          set('settings.appearance.colorTheme', target.value as any)
        }
      >
        <option>light</option>
        <option>dark</option>
      </S.Select>
      <label htmlFor="dark-sys">{$`@settings.use_system`}</label>
      <Switch id="dark-sys" {...toggle('useSystemTheme')} />
      <label htmlFor="extract">{$`@settings.extract_color`}</label>
      <Switch {...toggle('extractColor')} />
    </Section>
  )
}

const S = {
  Select: styled.select`
    text-transform: capitalize;
  `,
}
