import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

const Library = React.lazy(() => import('screens/Library'))
const Profile = React.lazy(() => import('screens/Profile'))

export default function Routes() {
  return (
    <Suspense fallback={<span>loading</span>}>
      <Switch>
        <Route exact path="/" component={Library} />
        <Route exact path="/profile" component={Profile} />
        <Redirect to="/" />
      </Switch>
    </Suspense>
  )
}
