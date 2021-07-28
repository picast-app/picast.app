import 'app/store/handlers/user'
import { pullPodcasts } from 'app/main/sync'
export * as actions from './actions'

setTimeout(() => pullPodcasts(), 500)
