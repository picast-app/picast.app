import React, { useState } from 'react'
import { Screen } from 'components/structure'
import { Link } from 'components/atoms'

export default function Sandbox() {
  const [loading, setLoading] = useState(false)

  return (
    <Screen padd loading={loading}>
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
      <button onClick={() => setLoading(!loading)}>toggle loading</button>
    </Screen>
  )
}
