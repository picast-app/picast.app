import React, { Suspense } from 'react'
import { Switch, Route, Redirect } from '@picast-app/router'
import { Progress } from 'app/components/atoms'
import EpisodeInfo from 'app/screens/EpisodeInfo'

const Library = React.lazy(() => import('app/screens/Library'))
const Feed = React.lazy(() => import('app/screens/Feed'))
const Discover = React.lazy(() => import('app/screens/Discover'))
const Profile = React.lazy(() => import('app/screens/Profile'))
const Search = React.lazy(() => import('app/screens/Search'))
const Podcast = React.lazy(() => import('app/screens/Podcast'))
const Sandbox = React.lazy(() => import('app/screens/Sandbox'))
const FeedView = React.lazy(() => import('app/screens/FeedView'))
const SignIn = React.lazy(() => import('app/screens/SignIn'))
const Settings = React.lazy(() => import('app/screens/Settings'))
const S404 = React.lazy(() => import('app/screens/404'))

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
        <Route path="/404">{S404}</Route>
        <Redirect to="/" />
      </Switch>
    </Suspense>
    <Route path="?info">{EpisodeInfo}</Route>
  </>
)
