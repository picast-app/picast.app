import { OptWeakValues } from './weak'

export const msg = <T extends WorkerMsgType>(
  type: T,
  payload: WorkerMsgPayload<T>,
  responseTo?: string
): WorkerMsg<T> => ({
  id: ((Math.random() * 1e9) | 0).toString(36),
  responseTo,
  type,
  payload,
})

export class ChannelManager<T extends WorkerName> {
  private static workers: TupleUnion<WorkerName> = ['main', 'service']
  private channels: { [k in WorkerName]?: MessagePort } = {}
  private queues: { [k in WorkerName]: WorkerMsg[] }
  public onMessage?: (
    message: WorkerMsg,
    source: Exclude<WorkerName, T>,
    respond: <T extends WorkerMsgType>(
      type: T,
      payload: WorkerMsgPayload<T>
    ) => void
  ) => void
  private readonly ansResolvers = new OptWeakValues<(msg: WorkerMsg) => void>()

  constructor(private readonly owner: T) {
    this.queues = Object.fromEntries(
      ChannelManager.workers.map(k => [k, []])
    ) as any
  }

  public addChannel(name: Exclude<WorkerName, T>, port: MessagePort) {
    if (!this.channels[name])
      this.queues[name].splice(0).forEach(v => port.postMessage(v))
    this.channels = { ...this.channels, [name]: port }

    port.onmessage = e => {
      const msg = e.data as WorkerMsg
      this.ansResolvers.get(msg.responseTo)?.(msg)
      this.onMessage?.(msg, name, (t, p) => {
        this.post(name, t, p, msg.id)
      })
    }
  }

  public post<T extends WorkerMsgType, K extends WorkerMsgType | void = void>(
    name: Exclude<WorkerName, K>,
    type: T,
    payload: WorkerMsgPayload<T>,
    responseTo?: string
  ): Promise<K extends WorkerMsgType ? WorkerMsg<K> : any> {
    const v = msg(type, payload, responseTo)
    if (this.channels[name])
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/10530
      this.channels[name].postMessage(v)
    else this.queues[name].push(v)
    return new Promise(res => {
      this.ansResolvers.set(v.id as string, res as any)
    })
  }
}
