import type { Transport } from 'typerpc'
import type Endpoint from 'typerpc'
import type Connection from 'typerpc/connection'
import type { Schema } from 'typerpc/types'

type WsTransport = Transport<string> & {
  connect<T extends Schema>(endpoint: Endpoint<any>): Connection<T>
}

export default function browserWSTransport(endpoint: string): WsTransport {
  let ws: WebSocket
  let queue: string[] = []
  const bufferMsg = (msg: string) => void queue.push(msg)
  let handleOut: (msg: string) => void = bufferMsg

  const connect = () => {
    logger.info('connect ws')
    ws = new WebSocket(endpoint)

    ws.onopen = () => {
      logger.info('ws connection open')
      handleOut = msg => ws.send(msg)
      queue.forEach(msg => ws.send(msg))
      queue = []
    }

    ws.onclose = e => {
      logger.warn('ws connction closed', e)
      handleOut = bufferMsg
      connect()
    }

    ws.onmessage = ({ data }) => {
      transport.in(data)
    }

    ws.onerror = e => logger.error('ws error:', e)
  }

  connect()

  const transport: WsTransport = {
    out: (addr, msg) => {
      if (addr !== endpoint)
        throw Error(
          `Invalid endpoint ${addr}, must be ${endpoint} for this transport.`
        )
      handleOut(msg)
    },
    in: msg => {
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
