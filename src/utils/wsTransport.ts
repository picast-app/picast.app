import type { Transport } from 'typerpc'
import type Endpoint from 'typerpc'
import type Connection from 'typerpc/connection'
import type { Schema } from 'typerpc/types'
import { store } from 'store'
import uiThread from 'main/ui'

type WsTransport = Transport<string> & {
  connect<T extends Schema>(endpoint: Endpoint<any>): Connection<T>
}

let logQueue: any[] | null = null
store.listen('settings.debug.printLogs', v => {
  if (v) (globalThis as any).wsQueue = logQueue ??= []
  else {
    logQueue = null
    if ('logQueue' in globalThis) delete (globalThis as any).logQueue
  }
})

export default function browserWSTransport(endpoint: string): WsTransport {
  let ws: WebSocket | null = null
  let cleanup: λ | null = null
  let queue: string[] = []
  const bufferMsg = (msg: string) => void queue.push(msg)
  let handleOut: (msg: string) => void = bufferMsg

  const connect = () => {
    if (ws) return
    logger.info('connect ws')
    ws = new WebSocket(endpoint)

    function onOpen() {
      logger.info('ws connection open')
      handleOut = msg => ws!.send(msg)
      queue.forEach(msg => ws!.send(msg))
      queue = []
    }

    function onClose(event: CloseEvent) {
      logger.warn('ws connection closed', { event, ...event })
      handleOut = bufferMsg
      cleanup?.()
      if (event.code <= 1001) return
      const timeout = 3000
      logger.info(`reconnect in ${timeout}`)
      setTimeout(connect, timeout)
    }

    function onMessage({ data }: MessageEvent<any>) {
      transport.in(data)
    }

    function onError(e: Event) {
      logger.error('ws error:', e)
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('message', onMessage)
    ws.addEventListener('error', onError)

    cleanup = () => {
      ws?.removeEventListener('open', onOpen)
      ws?.removeEventListener('close', onClose)
      ws?.removeEventListener('message', onMessage)
      ws?.removeEventListener('error', onError)
      ws = null
    }
  }

  connect()

  uiThread.addEventListener('beforeunload', () => {
    logger.info('close ws (beforeunload)')
    ws?.close()
  })

  const transport: WsTransport = {
    out: (addr, msg) => {
      if (addr !== endpoint)
        throw Error(
          `Invalid endpoint ${addr}, must be ${endpoint} for this transport.`
        )
      handleOut(msg)
    },
    in: msg => {
      logQueue?.push(msg)
      if (typeof transport.onInput !== 'function')
        throw Error('no input handler defined')
      transport.onInput(msg, endpoint)
    },
    connect(rpc) {
      rpc.addTransport(transport)
      return rpc.addConnection(endpoint, transport)
    },
  }

  return transport
}
