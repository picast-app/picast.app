import 'app/styles'
import 'app/polyfills'
import { togglePrint } from 'app/utils/logger'
import 'app/components/webcomponents'
import React from 'react'
import ReactDOM from 'react-dom'
import 'app/i18n/strings'
import store from 'app/store/uiThread/api'
import App from './App'
import 'app/store/uiThread/hooks'

store.listenX('settings.debug.printLogs', togglePrint)

window.addEventListener('echo_reload', () => {
  location.reload()
})

logger.info(`running in ${process.env.NODE_ENV} env`)
const strictMode = process.env.NODE_ENV === 'development' && false

let app = <App />
if (strictMode) app = <React.StrictMode>{app}</React.StrictMode>

ReactDOM.render(app, document.getElementById('root'))
