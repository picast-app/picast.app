type PromType<T> = T extends PromiseLike<infer U> ? U : T

type MaybeProm<T> = T extends PromiseLike<infer U>
  ? MaybeProm<U>
  : T | Promise<T>

type FilterKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

type TupleUnion<U extends string, R extends string[] = []> = {
  [S in U]: Exclude<U, S> extends never
    ? [...R, S]
    : TupleUnion<Exclude<U, S>, [...R, S]>
}[U] &
  string[]

type NullOpt<T> = {
  [P in keyof T]: T[P] extends null ? T[P] | undefined : T[P]
}

type GqlType<T> = Optional<NullOpt<T>, '__typename'>

type CondArr<T, K> = T extends any[] ? K[] : K
