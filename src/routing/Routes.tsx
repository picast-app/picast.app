import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Progress } from 'components/atoms'
import location from 'routing/location'

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
    <Switch location={location}>
      <Route exact path="/" component={Library} />
      <Route exact path="/feed" component={Feed} />
      <Route exact path="/profile" component={Profile} />
      <Route exact path="/discover" component={Discover} />
      <Route exact path="/search" component={Search} />
      <Route exact path="/show/:id" component={Podcast} />
      <Route exact path="/signin" component={SignIn} />
      <Route exact path="/settings/:page?" component={Settings} />
      <Route exact path="/sandbox" component={Sandbox} />
      <Route exact path="/sandbox/elevation" component={Elevation} />
      <Route exact path="/sandbox/ease" component={Ease} />
      <Route exact path="/sandbox/components" component={Components} />
      <Route path="/feedview" component={FeedView} />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)