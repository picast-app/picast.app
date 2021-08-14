import { OrderedMap } from 'utils/ordered'

type PathIter<T> = IterableIterator<[path: string, value: T]> & {
  from(path: string): PathIter<T>
}

export default class Paths<T> {
  constructor(private readonly value: (key: string) => T) {
    Object.defineProperties(this, {
      rln: { get: this.iter(-1) },
      nlr: { get: this.iter(1) },
    })
  }

  private handlers = new OrderedMap<string, T>()

  public get(key: string): T {
    if (!this.handlers.has(key)) this.handlers.set(key, this.value(key))
    return this.handlers.get(key)!
  }

  private iter = (dir: 1 | -1, startAt?: string) => (): PathIter<T> => {
    let i = dir === 1 ? -1 : this.handlers.size

    if (startAt) {
      for (i = i + dir; i >= 0 && i < this.handlers.size; i += dir)
        if (this.handlers.at(i)![0] === startAt) break
      i -= dir
    }

    return {
      [Symbol.iterator]() {
        return this
      },
      next: () => {
        i += dir
        return {
          done: i === (dir === 1 ? this.handlers.size : -1),
          value: this.handlers.at(i)!,
        }
      },
      from: path => this.iter(dir, path)(),
    }
  }

  // depth-first post-order right to left
  public rln!: PathIter<T>

  // depth-first pre-order left to right
  public nlr!: PathIter<T>
}
