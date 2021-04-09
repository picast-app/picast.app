import React, { Suspense, useState, useEffect } from 'react'
import { Route, Switch, Redirect, useLocation } from 'react-router-dom'
import { Progress } from 'components/atoms'

const Library = React.lazy(() => import('screens/Library'))
const Profile = React.lazy(() => import('screens/Profile'))
const Discover = React.lazy(() => import('screens/Discover'))
const Search = React.lazy(() => import('screens/Search'))
const Podcast = React.lazy(() => import('./screens/Podcast'))
const Sandbox = React.lazy(() => import('screens/Sandbox'))
const Elevation = React.lazy(() => import('screens/sandbox/Elevation'))
const Ease = React.lazy(() => import('screens/sandbox/Ease'))
const Components = React.lazy(() => import('./screens/sandbox/Components'))
const FeedView = React.lazy(() => import('./screens/FeedView'))
const SignIn = React.lazy(() => import('./screens/SignIn'))
const Settings = React.lazy(() => import('./screens/Settings'))

const getLocation = () => {
  const { pathname, search } = location
  return { pathname, search, hash: '', state: history.state }
}

const Routes = () => (
  <Suspense fallback={<Progress />}>
    <Switch location={useSwitchLocation()}>
      <Route exact path="/" component={Library} />
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
export default Routes

function useSwitchLocation() {
  const [location, setLocation] = useState(getLocation)

  const _loc = useLocation()
  useEffect(() => {
    const loc = getLocation()
    if (Object.entries(loc).every(([k, v]) => (location as any)[k] === v))
      return
    setLocation(getLocation())
  }, [location, _loc])

  return location
}
