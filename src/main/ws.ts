import Endpoint from 'typerpc'
import browserWS from 'utils/wsTransport'
import { store } from 'store'
import epStore from 'main/episodeStore'
import type { Schema as WSAPI } from 'types/ws'

const endpoint = new Endpoint({
  episodeAdded: { params: { podcast: String, episodes: Object } },
  addEpisodes: { params: Object },
  seedComplete: { params: { podcasts: Object } },
  hasAllEpisodes: { params: { podcast: String, total: Number } },
  hasCovers: { params: { id: String, covers: Object, palette: Object } },
})

const connect = () =>
  browserWS(process.env.REACT_APP_WS!).connect<WSAPI>(endpoint)

export const wsApi: Partial<ReturnType<typeof connect>> = process.env.DISABLE_WS
  ? {}
  : connect()

export default endpoint

endpoint.on('episodeAdded', async ({ podcast, episodes }) => {
  const formatted = episodes.map(({ url, published, ...rest }: any) => ({
    file: url,
    published: new Date(published).getTime(),
    podcast,
    ...rest,
  }))
  logger.info('episodeAdded', formatted)
  ;(await (await epStore).getPodcast(podcast)).addEpisodes(formatted, true)
})

endpoint.on('addEpisodes', async podcasts => {
  const podStore = await epStore
  Object.entries(podcasts).map(async ([podcast, episodes]) => {
    const podEpStore = await podStore.getPodcast(podcast)
    const formatted = (episodes as any[]).map(
      ({ url, published, ...rest }: any) => ({
        file: url,
        published: new Date(published).getTime(),
        podcast,
        ...rest,
      })
    )
    podEpStore.addEpisodes(formatted, true)
  })
})

endpoint.on('seedComplete', ({ podcasts }) => {
  ;(podcasts as string[]).map(id =>
    store.set('podcasts.*.seeding', false, {}, id)
  )
})

endpoint.on('hasAllEpisodes', ({ podcast, total }) => {
  logger.info('has all episodes', { podcast, total })
})

endpoint.on('hasCovers', ({ id, covers, palette }) => {
  logger.info(`got covers for ${id}`, { covers, palette })
  if (covers) store.set('podcasts.*.covers', covers, {}, id)
  if (palette) store.set('podcasts.*.palette', palette)
})

store.listen('user.wsAuth', token => {
  if (token) wsApi.notify?.('identify', token)
})
