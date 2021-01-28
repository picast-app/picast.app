import React from 'react'
import ReactDOM from 'react-dom'
import reportWebVitals from './reportWebVitals'
import { Router } from 'react-router-dom'
import history from 'utils/history'
import { togglePrint } from 'utils/logger'
import App from './App'
import { main } from './workers'
import 'styles'

main.idbGet('meta', 'printLogs').then((v?: boolean) => {
  if (v === undefined) return
  togglePrint(v)
})

window.addEventListener('echo_reload', () => {
  location.reload()
})

ReactDOM.render(
  <React.StrictMode>
    <Router history={history}>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

reportWebVitals()
