export default class FinalizationRegistry {
  constructor(private readonly cb: (held: unknown) => any) {}

  register(target: any, value: any, token?: any) {}
}
