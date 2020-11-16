import React from 'react'
import { Screen } from 'components/structure'
import { Link } from 'components/atoms'

export default function Sandbox() {
  return (
    <Screen padd>
      <ol>
        <li>
          <Link append to="elevation">
            Elevation
          </Link>
        </li>
        <li>
          <Link append to="ease">
            Ease
          </Link>
        </li>
      </ol>
    </Screen>
  )
}
