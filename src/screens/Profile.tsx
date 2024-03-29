import React from 'react'
import Appbar from 'components/Appbar'
import { Icon, Button } from 'components/atoms'
import { Screen } from 'components/structure'
import { Redirect } from '@picast-app/router'
import { main } from 'workers'
import { useStateX } from 'hooks/store'

export default function Profile() {
  const [user] = useStateX('user')

  if (user === null) return <Redirect to="/signin" />
  return (
    <Screen padd>
      <Appbar title="Profile">
        <Icon icon="gear" linkTo="/settings" />
      </Appbar>
      <Button onClick={() => main.signOut()}>sign out</Button>
    </Screen>
  )
}
