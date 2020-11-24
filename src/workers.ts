import { wrap } from 'comlink'
import MainWorker from 'main/main.worker'

export const main = wrap<MainAPI>(new (MainWorker as any)())
