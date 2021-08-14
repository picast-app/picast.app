type PromType<T> = T extends PromiseLike<infer U> ? U : T
type MaybeProm<T> = T extends PromiseLike<infer U> ? U | T : T | Promise<T>

type FilterKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

type PickOpt<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type PickReq<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>

type TupleUnion<U extends string, R extends string[] = []> = {
  [S in U]: Exclude<U, S> extends never
    ? [...R, S]
    : TupleUnion<Exclude<U, S>, [...R, S]>
}[U] &
  string[]

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

type MergeDistr<U> = UnionToIntersection<U> extends infer O
  ? { [K in keyof O]: O[K] }
  : never

type Primitive = string | number | boolean | symbol | null | undefined

type NullOpt<T> = {
  [P in keyof T]: T[P] extends null ? T[P] | undefined : T[P]
}

type GqlType<T> = Optional<NullOpt<T>, '__typename'>

type CondArr<T, K> = T extends any[] ? K[] : K

type λ<TA extends any[] = any[], TR = any> = (...args: TA) => TR
type Fun = λ

type OmitValue<T, O> = {
  [K in keyof Required<T> as Exclude<T[K], O> extends never
    ? never
    : K]: Exclude<T[K], O>
}
