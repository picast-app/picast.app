type PathMap<T> = [path: string, handler: T][]

type PathIter<T> = Iterator<[path: string, value: T]> &
  Iterable<[path: string, value: T]> & { from(path: string): PathIter<T> }

export default class Paths<T> {
  constructor(private readonly value: (key: string) => T) {
    Object.defineProperties(this, {
      rln: { get: this.iter(1) },
      nlr: { get: this.iter(-1) },
    })
  }

  private handlers: PathMap<T> = []

  public get(key: string): T {
    let i = this.handlers.findIndex(([k]) => k <= key)
    if (i < 0) i = this.handlers.length
    if (this.handlers[i]?.[0] !== key)
      this.handlers.splice(i, 0, [key, this.value(key)])
    return this.handlers[i][1]
  }

  private iter = (dir: 1 | -1, startAt?: string) => (): PathIter<T> => {
    let i = dir === 1 ? -1 : this.handlers.length

    if (startAt) {
      for (i = i + dir; i >= 0 && i < this.handlers.length; i += dir)
        if (this.handlers[i][0] === startAt) break
      i -= dir
    }

    return {
      [Symbol.iterator]() {
        return this
      },

      next: () => {
        i += dir
        return {
          done: i === (dir === 1 ? this.handlers.length : -1),
          value: this.handlers[i],
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
