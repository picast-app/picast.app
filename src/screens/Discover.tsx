import React from 'react'
import { Icon } from 'components/atoms'
import { Screen } from 'components/structure'
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
