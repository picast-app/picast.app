import 'styles'
import 'polyfills'
import { togglePrint } from 'utils/logger'
import 'components/webcomponents'
import React from 'react'
import ReactDOM from 'react-dom'
import 'i18n/strings'
import store from 'store/uiThread/api'
import App from './App'
import 'store/uiThread/hooks'
import { serviceWorker } from 'workers'

store.listenX('settings.debug.printLogs', async v => {
  togglePrint(v)
  await (await serviceWorker)?.toggleLogger(true)
})

window.addEventListener('echo_reload', () => {
  location.reload()
})

logger.info(`running in ${process.env.NODE_ENV} env`)
const strictMode = process.env.NODE_ENV === 'development' && false

let app = <App />
if (strictMode) app = <React.StrictMode>{app}</React.StrictMode>

ReactDOM.render(app, document.getElementById('root'))
