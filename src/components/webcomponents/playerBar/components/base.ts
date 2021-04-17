import { bindThis } from 'utils/proto'
import type Player from '../player.comp'

export default abstract class ServiceBase {
  constructor(protected readonly player: Player) {
    bindThis(this)
  }
  public abstract start(): void
  public abstract stop(): void
}
