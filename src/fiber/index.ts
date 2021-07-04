import TestWorker from './test.worker'
import type { API } from './test.worker'
import { wrap } from './fiber'

const worker: Worker = new (TestWorker as any)()

// worker.postMessage({ __f: 0 })

const remote = wrap<API>(worker)

;(async () => {
  const v = await remote.count
  logger.info('count:', v)

  // logger.info(await remote.incr())

  const nested = await remote.nested
  const foo = await remote.nested.foo
  const bar = await remote.nested.foo.bar
  logger.info({ nested, foo, bar })
})()
