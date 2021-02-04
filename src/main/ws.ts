import Endpoint from 'typerpc'
import browserWS from 'typerpc/transport/ws/browser'
import type { Schema as WSAPI } from 'types/ws'

const endpoint = new Endpoint({
  episodeAdded: { params: { podcast: String, episodes: Object } },
  hasAllEpisodes: { params: String },
})

export const wsApi = browserWS(process.env.REACT_APP_WS!).connect<WSAPI>(
  endpoint
)

export default endpoint
