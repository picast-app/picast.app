export default class WeakRef<T> {
  constructor(private readonly value: T) {}

  public deref(): T {
    return this.value
  }
}
