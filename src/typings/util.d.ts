type PromType<T> = T extends PromiseLike<infer U> ? U : T
type FilterKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]
