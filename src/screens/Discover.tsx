import React from 'react'
import { Icon } from 'app/components/atoms'
import { Screen } from 'app/components/structure'
import Appbar from 'app/components/Appbar'

export default function Discover() {
  return (
    <Screen>
      <Appbar title="Discover">
        <Icon icon="search" linkTo="/search" />
      </Appbar>
    </Screen>
  )
}
