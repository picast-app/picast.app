import React, { Suspense } from 'react'
import { Switch, Route, Redirect } from '@picast-app/router'
import { Progress } from 'components/atoms'

const Library = React.lazy(() => import('screens/Library'))
const Feed = React.lazy(() => import('screens/Feed'))
const Discover = React.lazy(() => import('screens/Discover'))
const Profile = React.lazy(() => import('screens/Profile'))
const Search = React.lazy(() => import('screens/Search'))
const Podcast = React.lazy(() => import('screens/Podcast'))
const Sandbox = React.lazy(() => import('screens/Sandbox'))
const Elevation = React.lazy(() => import('screens/sandbox/Elevation'))
const Ease = React.lazy(() => import('screens/sandbox/Ease'))
const Components = React.lazy(() => import('screens/sandbox/Components'))
const FeedView = React.lazy(() => import('screens/FeedView'))
const SignIn = React.lazy(() => import('screens/SignIn'))
const Settings = React.lazy(() => import('screens/Settings'))

export default () => (
  <Suspense fallback={<Progress />}>
    <Switch>
      <Route path="/">{Library}</Route>
      <Route path="/feed">{Feed}</Route>
      <Route path="/profile">{Profile}</Route>
      <Route path="/discover">{Discover}</Route>
      <Route path="/search">{Search}</Route>
      <Route path="/show/:id">{Podcast}</Route>
      <Route path="/signin">{SignIn}</Route>
      <Route path="/settings/:page?">{Settings}</Route>
      <Route path="/sandbox">{Sandbox}</Route>
      <Route path="/sandbox/elevation">{Elevation}</Route>
      <Route path="/sandbox/ease">{Ease}</Route>
      <Route path="/sandbox/components">{Components}</Route>
      <Route path="/feedview">{FeedView}</Route>
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
