export default class Job {
  constructor(
    public interval: number,
    private readonly task: λ<[]>,
    private readonly runImmediate = false
  ) {
    this.run = this.run.bind(this)
  }

  public onError?: (err: unknown) => void

  public start(immediate?: boolean) {
    if ('taskId' in this) return
    if (immediate ?? this.runImmediate) this.run()
    else this.schedule()
  }

  public stop() {
    clearTimeout(this.taskId)
    delete this.taskId
  }

  private taskId?: number

  private async run() {
    clearTimeout(this.taskId)
    this.taskId = NaN
    try {
      await this.task()
    } catch (e) {
      if (this.onError) this.onError(e)
      else logger.warn(`unhandled error in job: ${e}`)
    }
    this.schedule()
  }

  private schedule() {
    this.taskId = setTimeout(this.run, this.interval) as any
  }

  public once() {
    return this.task()
  }
}
