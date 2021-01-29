import React from 'react'
import Appbar from 'components/Appbar'
import { Icon } from 'components/atoms'
import { Screen } from 'components/structure'
import { Redirect } from 'react-router-dom'
import { useAPICall } from 'utils/hooks'

export default function Profile() {
  const [me, loading] = useAPICall('me')

  if (!loading && !me) return <Redirect to="/signin" />
  return (
    <Screen padd loading={loading}>
      <Appbar title="Profile">
        <Icon icon="gear" linkTo="/settings" />
      </Appbar>
      {!loading && (
        <>
          <span>signed in with {me?.authProvider}</span>
        </>
      )}
    </Screen>
  )
}
