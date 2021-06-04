import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useMatchMedia } from 'hooks'

export default function Appearance() {
  const systemDark = useMatchMedia('(prefers-color-scheme: dark)')
  const systemTheme = systemDark ? 'dark' : 'light'
  const [customTheme, setCstTheme] = useState<'light' | 'dark' | null>(
    localStorage.getItem('custom-theme') as any
  )

  useEffect(() => {
    if (!customTheme) {
      localStorage.removeItem('custom-theme')
      document.documentElement.dataset.theme = systemTheme
    } else {
      localStorage.setItem('custom-theme', customTheme)
      document.documentElement.dataset.theme = customTheme
    }
  }, [customTheme, systemTheme])

  return (
    <Section title={$.c`theme`}>
      <label htmlFor="mode">{$`@settings.pick_theme`}</label>
      <S.Select
        id="mode"
        name="Theme"
        value={customTheme ?? systemTheme}
        onChange={({ target }) => {
          setCstTheme(target.value as any)
          localStorage.setItem('custom-theme', target.value)
        }}
        disabled={!customTheme}
      >
        <option>light</option>
        <option>dark</option>
      </S.Select>
      <label htmlFor="dark-sys">{$`@settings.use_system`}</label>
      <Switch
        id="dark-sys"
        checked={!customTheme}
        onChange={v => {
          setCstTheme(!v ? (systemTheme as any) : null)
        }}
      />
      <label htmlFor="extract">{$`@settings.extract_color`}</label>
      <Switch id="extract" />
    </Section>
  )
}

const S = {
  Select: styled.select`
    text-transform: capitalize;
  `,
}
