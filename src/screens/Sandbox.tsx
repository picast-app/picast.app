import React, { useState } from 'react'
import { Screen } from 'components/structure'
import { Link } from '@picast-app/router'

export default function Sandbox() {
  const [loading, setLoading] = useState(false)

  return (
    <Screen padd loading={loading}>
      <ol>
        <li>
          <Link to="/sandbox/elevation">Elevation</Link>
        </li>
        <li>
          <Link to="/sandbox/ease">Ease</Link>
        </li>
        <li>
          <Link to="/sandbox/components">Components</Link>
        </li>
      </ol>
      <button onClick={() => setLoading(!loading)}>toggle loading</button>
    </Screen>
  )
}
