import React from 'react'
import { Icon } from 'components/atoms'
import Screen from 'components/Screen'
import Appbar from 'components/Appbar'

export default function Discover() {
  return (
    <Screen>
      <Appbar title="Discover">
        <Icon icon="search" linkTo="/search" />
      </Appbar>
    </Screen>
  )
}
