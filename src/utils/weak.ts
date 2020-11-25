// eslint-disable-next-line @typescript-eslint/ban-types
export class OptWeakValues<T extends object> {
  private readonly dict: { [k: string]: WeakRef<T> } = {}

  public get(id?: string): T | undefined {
    if (!id) return
    return this.dict[id]?.deref()
  }

  public set(id: string, v: T) {
    this.dict[id] =
      'WeakRef' in globalThis
        ? new WeakRef(v)
        : ({ deref: () => v } as WeakRef<T>)
    this.registry.register(v, id)
  }

  public delete(k: string) {
    delete this.dict[k]
  }

  private registry = new (globalThis.FinalizationRegistry ?? class {})(id => {
    this.delete(id)
  })
}
