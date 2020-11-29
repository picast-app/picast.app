export const ws = new WebSocket(process.env.REACT_APP_WS as string)

ws.onmessage = e => {
  console.log('got a message', e)
}

let queue: any[] = []

export const send = (msg: any) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg))
  else queue.push(msg)
}

ws.onopen = () => {
  queue.forEach(msg => ws.send(JSON.stringify(msg)))
  queue = []
}
