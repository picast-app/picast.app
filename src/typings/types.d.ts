type ReactProps<
  T extends (...args: any[]) => JSX.Element | import('react').Component | null
> = Parameters<T>[0]

type RGBA = number
type RGBA_ = [number, number, number, number]

type EchoPlayEvent = CustomEvent<{ track?: string }>
type EchoJumpEvent = CustomEvent<{ location: number }>

type PromType<T> = T extends PromiseLike<infer U> ? U : T
