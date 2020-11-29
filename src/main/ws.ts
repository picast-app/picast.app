export const ws = new WebSocket(process.env.REACT_APP_WS as string)

let queue: any[] = []
let listeners: ((msg: any) => void)[] = []

ws.onmessage = e => {
  try {
    const msg = JSON.parse(e.data)
    listeners.forEach(listener => listener(msg))
  } catch (e) {
    console.error(e)
  }
}

export const send = (msg: any) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg))
  else queue.push(msg)
}

ws.onopen = () => {
  queue.forEach(msg => ws.send(JSON.stringify(msg)))
  queue = []
}

export const addListener = (listener: typeof listeners[number]) => {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(v => v !== listener)
  }
}
