export default class FinalizationRegistry {
  constructor(private readonly cb: (held: unknown) => any) {}
}
