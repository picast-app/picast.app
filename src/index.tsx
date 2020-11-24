import React from 'react'
import ReactDOM from 'react-dom'
import reportWebVitals from './reportWebVitals'
import { Router } from 'react-router-dom'
import history from 'utils/history'
import App from './App'
import { ApolloProvider } from '@apollo/client'
import api from 'api'
import 'styles'
import MainWorker from 'test.worker'

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

const worker: Worker = new (MainWorker as any)()
console.log(worker)

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={api}>
      <Router history={history}>
        <App />
      </Router>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

reportWebVitals()
