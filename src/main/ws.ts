import Endpoint from 'typerpc'
import browserWS from 'typerpc/transport/ws/browser'
import type { Schema as WSAPI } from 'types/ws'

const endpoint = new Endpoint({
  episodeAdded: { params: { podcast: String, episodes: Object } },
  hasAllEpisodes: { params: String },
})

const connect = () =>
  browserWS(process.env.REACT_APP_WS!).connect<WSAPI>(endpoint)

export const wsApi: Pick<
  ReturnType<typeof connect>,
  'call' | 'notify'
> = process.env.DISABLE_WS
  ? { async notify() {}, call: () => Promise.resolve() as any }
  : connect()

export default endpoint
