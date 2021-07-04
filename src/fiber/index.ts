import TestWorker from './test.worker'
import type { API } from './test.worker'
import { wrap, proxy } from './fiber'

const worker: Worker = new (TestWorker as any)()

const remote = wrap<API>(worker)

;(async () => {
  const cb = (...args: any[]) => {
    logger.info('[cb]:', ...args)
    return 'hello back'
  }
  logger.info('remote:', await remote.callCB(proxy(cb)))
})()
