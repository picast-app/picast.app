import React from 'react'
import Screen from 'components/Screen'
import Appbar from 'components/Appbar'
import PodcastSearch from 'components/PodcastSearch'

export default function Search() {
  return (
    <Screen>
      <Appbar back="/discover">
        <PodcastSearch />
      </Appbar>
    </Screen>
  )
}
