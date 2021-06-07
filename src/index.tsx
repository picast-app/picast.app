import 'styles'
import 'components/webcomponents'
import React from 'react'
import ReactDOM from 'react-dom'
import 'i18n/strings'
import { togglePrint } from 'utils/logger'
import App from './App'
import { state } from './workers'
import 'store/uiStateHooks'

state<boolean>('debug.print_logs', togglePrint)

window.addEventListener('echo_reload', () => {
  location.reload()
})

logger.info(`running in ${process.env.NODE_ENV} env`)
const strictMode = process.env.NODE_ENV === 'development' && false

let app = <App />
if (strictMode) app = <React.StrictMode>{app}</React.StrictMode>

ReactDOM.render(app, document.getElementById('root'))
