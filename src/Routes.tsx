import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

export default function Routes() {
  return (
    <Suspense fallback={<span>loading</span>}>
      <Switch></Switch>
    </Suspense>
  )
}
