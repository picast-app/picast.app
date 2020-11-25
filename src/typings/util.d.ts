type PromType<T> = T extends PromiseLike<infer U> ? U : T

type FilterKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

type TupleUnion<U extends string, R extends string[] = []> = {
  [S in U]: Exclude<U, S> extends never
    ? [...R, S]
    : TupleUnion<Exclude<U, S>, [...R, S]>
}[U] &
  string[]
