import React, { useState } from 'react'
import { Switch, Route, Redirect, Link } from '@picast-app/router'
import { Screen } from 'app/components/structure'
import elevation from './sandbox/Elevation'
import ease from './sandbox/Ease'
import components from './sandbox/Components'
import audio from './sandbox/Audio'

const routes = {
  elevation,
  components,
  ease,
  audio,
}

export default function Routes() {
  return (
    <Switch>
      <Route path="/sandbox">{Sandbox}</Route>
      {Object.entries(routes).map(([k, v]) => (
        <Route key={k} path={`/sandbox/${k}`}>
          {v}
        </Route>
      ))}
      <Redirect to="/sandbox" />
    </Switch>
  )
}

function Sandbox() {
  const [loading, setLoading] = useState(false)

  return (
    <Screen padd loading={loading}>
      <ol>
        {Object.entries(routes).map(([k, v]) => (
          <li key={k}>
            <Link to={`/sandbox/${k}`}>{k}</Link>
          </li>
        ))}
      </ol>
      <button onClick={() => setLoading(!loading)}>toggle loading</button>
    </Screen>
  )
}
