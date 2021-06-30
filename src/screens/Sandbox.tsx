import React, { useState } from 'react'
import { Switch, Route, Redirect, Link } from '@picast-app/router'
import { Screen } from 'components/structure'
import Elevation from './sandbox/Elevation'
import Ease from './sandbox/Ease'
import Components from './sandbox/Components'

export default function Routes() {
  return (
    <Switch>
      <Route path="/sandbox">{Sandbox}</Route>
      <Route path="/sandbox/elevation">{Elevation}</Route>
      <Route path="/sandbox/ease">{Ease}</Route>
      <Route path="/sandbox/components">{Components}</Route>
      <Redirect to="/sandbox" />
    </Switch>
  )
}

function Sandbox() {
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
