import React from 'react'
import Appbar from 'components/Appbar'
import { Icon, Button } from 'components/atoms'
import { Screen } from 'components/structure'
import { Redirect } from '@picast-app/router'
import { useAppState } from 'utils/hooks'
import { main } from 'workers'

export default function Profile() {
  const [signedIn, loading] = useAppState<boolean>('user.signedIn')

  if (!loading && !signedIn) return <Redirect to="/signin" />
  return (
    <Screen padd>
      <Appbar title="Profile">
        <Icon icon="gear" linkTo="/settings" />
      </Appbar>
      <Button onClick={() => main.signOut()}>sign out</Button>
    </Screen>
  )
}
