import React, { useState, useEffect } from 'react'
import Section from './Section'
import { Switch } from 'components/atoms'
import { useMatchMedia } from 'utils/hooks'

export default function Appearance() {
  const systemDark = useMatchMedia('(prefers-color-scheme: dark)')
  const systemTheme = systemDark ? 'Dark' : 'Light'
  const [customTheme, setCstTheme] = useState<'light' | 'dark' | null>(
    localStorage.getItem('custom-theme') as any
  )

  useEffect(() => {
    if (!customTheme) {
      localStorage.removeItem('custom-theme')
      document.documentElement.dataset.theme = systemTheme.toLowerCase()
    } else {
      localStorage.setItem('custom-theme', customTheme.toLowerCase())
      document.documentElement.dataset.theme = customTheme.toLowerCase()
    }
  }, [customTheme, systemTheme])

  return (
    <Section title="Theme">
      <label htmlFor="mode">Color theme</label>
      <select
        id="mode"
        name="Theme"
        value={customTheme ?? systemTheme}
        onChange={({ target }) => {
          setCstTheme(target.value as any)
          localStorage.setItem('custom-theme', target.value)
        }}
        disabled={!customTheme}
      >
        <option>Light</option>
        <option>Dark</option>
      </select>
      <label htmlFor="dark-sys">Use system theme</label>
      <Switch
        id="dark-sys"
        checked={!customTheme}
        onChange={v => {
          setCstTheme(!v ? (systemTheme as any) : null)
        }}
      />
    </Section>
  )
}
