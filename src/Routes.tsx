import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

const Library = React.lazy(() => import('screens/Library'))
const Profile = React.lazy(() => import('screens/Profile'))
const Discover = React.lazy(() => import('screens/Discover'))
const Search = React.lazy(() => import('screens/Search'))
const Sandbox = React.lazy(() => import('screens/Sandbox'))

export default function Routes() {
  return (
    <Suspense fallback={<span>loading</span>}>
      <Switch>
        <Route exact path="/" component={Library} />
        <Route exact path="/profile" component={Profile} />
        <Route exact path="/discover" component={Discover} />
        <Route exact path="/search" component={Search} />
        <Route exact path="/sandbox" component={Sandbox} />
        <Redirect to="/" />
      </Switch>
    </Suspense>
  )
}
