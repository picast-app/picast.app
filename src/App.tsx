import React from 'react'
import Routes from 'Routes'
import Mainnav from 'components/Mainnav'
import { Theme } from 'styles'
import { useMatchMedia } from 'utils/hooks'

export default function App() {
  const isDarkMode = useMatchMedia('(prefers-color-scheme: dark)')

  return (
    <Theme.Provider value={isDarkMode ? 'dark' : 'light'}>
      <Routes />
      <Mainnav />
    </Theme.Provider>
  )
}
