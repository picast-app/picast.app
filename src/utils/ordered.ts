// if >0 sort b before a
type Comparator<T = unknown> = (a: T, b: T) => number
const defaultComp = (a: any, b: any) => +(a > b)

export class OrderedList<T> {
  constructor(
    private readonly comp: Comparator<T> = defaultComp,
    ...elems: T[]
  ) {
    if (elems.length) this.add(...elems)
  }

  public add(...elem: T[]) {
    for (const el of elem) this.elems.splice(this.slot(el), 0, el)
  }

  public clear() {
    this.elems = []
    return this
  }

  public indexOf = (el: T) => {
    const i = this.slot(el)
    return this.elems[i] === el ? i : -1
  }
  public has = (el: T) => this.indexOf(el) >= 0

  public at(index: number): T | undefined {
    return this.elems[index]
  }

  public remove(el: T) {
    const i = this.indexOf(el)
    if (i >= 0) this.elems.splice(i, 1)
    return this
  }

  public map = <TN>(cb: (value: T, index: number) => TN): TN[] =>
    this.elems.map((v, i) => cb(v, i))

  public filter(cb: (value: T, index: number) => boolean): OrderedList<T> {
    const filtered = new OrderedList(this.comp)
    filtered.elems = this.elems.filter((v, i) => cb(v, i))
    return filtered
  }

  public [Symbol.iterator]() {
    let i = -1
    return {
      next: () => {
        i++
        return {
          value: this.elems[i],
          done: i >= this.elems.length,
        }
      },
    }
  }

  public get size() {
    return this.elems.length
  }

  public get values(): T[] {
    return [...this.elems]
  }

  private slot(
    el: T,
    i = Math.floor(this.elems.length / 2),
    range = this.elems.length
  ): number {
    if (range === 0) return i
    const sortLeft = this.comp(el, this.elems[i]) <= 0
    if (range === 1) return sortLeft ? i : i + 1
    if (sortLeft) return this.slot(el, Math.floor(i / 2), i)
    const rr = Math.floor((range - 1) / 2)
    return this.slot(el, i + 1 + Math.floor(rr / 2), rr)
  }

  private elems: T[] = []
}
