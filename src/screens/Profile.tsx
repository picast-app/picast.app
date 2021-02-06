import React from 'react'
import Appbar from 'components/Appbar'
import { Icon } from 'components/atoms'
import { Screen } from 'components/structure'
import { Redirect } from 'react-router-dom'
import { useAppState } from 'utils/hooks'

export default function Profile() {
  const [signedIn, loading] = useAppState<boolean>('signedIn')

  if (!loading && !signedIn) return <Redirect to="/signin" />
  return (
    <Screen padd>
      <Appbar title="Profile">
        <Icon icon="gear" linkTo="/settings" />
      </Appbar>
    </Screen>
  )
}
