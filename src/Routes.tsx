import React, { Suspense } from 'react'
import { Switch, Route, Redirect } from '@picast-app/router'
import { Progress } from 'components/atoms'
import EpisodeInfo from 'screens/EpisodeInfo'

const Library = React.lazy(() => import('screens/Library'))
const Feed = React.lazy(() => import('screens/Feed'))
const Discover = React.lazy(() => import('screens/Discover'))
const Profile = React.lazy(() => import('screens/Profile'))
const Search = React.lazy(() => import('screens/Search'))
const Podcast = React.lazy(() => import('screens/Podcast'))
const Sandbox = React.lazy(() => import('screens/Sandbox'))
const FeedView = React.lazy(() => import('screens/FeedView'))
const SignIn = React.lazy(() => import('screens/SignIn'))
const Settings = React.lazy(() => import('screens/Settings'))
const DebugState = React.lazy(() => import('screens/debug/state'))
const S404 = React.lazy(() => import('screens/404'))

export default () => (
  <>
    <Suspense fallback={<Progress />}>
      <Switch>
        <Route path="/">{Library}</Route>
        <Route path="/feed">{Feed}</Route>
        <Route path="/profile">{Profile}</Route>
        <Route path="/discover">{Discover}</Route>
        <Route path="/search">{Search}</Route>
        <Route path="/show/:id">{Podcast}</Route>
        <Route path="/sign(in|up)">{SignIn}</Route>
        <Route path="/settings/:page?">{Settings}</Route>
        <Route path="/sandbox/:sub?">{Sandbox}</Route>
        <Route path="/feedview/.*">{FeedView}</Route>
        <Route path="/debug/state">{DebugState}</Route>
        <Route path="/404">{S404}</Route>
        <Redirect to="/" />
      </Switch>
    </Suspense>
    <Route path="?info">{EpisodeInfo}</Route>
  </>
)
