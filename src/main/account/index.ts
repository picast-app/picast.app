import 'store/handlers/user'
import { pullPodcasts } from 'main/sync'
export * as actions from './actions'

setTimeout(() => pullPodcasts(), 500)
