import 'styles'
import 'components/webcomponents'
import React from 'react'
import ReactDOM from 'react-dom'
import reportWebVitals from './reportWebVitals'
import { togglePrint } from 'utils/logger'
import 'utils/logger'
import App from './App'
import { state } from './workers'

state<boolean>('debug.print_logs', togglePrint)

window.addEventListener('echo_reload', () => {
  location.reload()
})

matchMedia('(prefers-color-scheme: dark)').onchange = ({ matches }) => {
  if (localStorage.getItem('custom-theme')) return
  document.documentElement.dataset.theme = matches ? 'dark' : 'light'
}

logger.info(`running in ${process.env.NODE_ENV} env`)
const strictMode = process.env.NODE_ENV === 'development' && false

let app = <App />
if (strictMode) app = <React.StrictMode>{app}</React.StrictMode>

ReactDOM.render(app, document.getElementById('root'))

window.addEventListener('storage', ({ key, newValue }) => {
  if (key !== 'custom-theme') return
  if (newValue !== localStorage.getItem(key))
    newValue
      ? localStorage.setItem(key, newValue)
      : localStorage.removeItem(key)

  const theme =
    newValue ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.dataset.theme = theme
})

reportWebVitals()
