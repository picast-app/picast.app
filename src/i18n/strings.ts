import defaultDict from 'strings/en.json'

export type Key = keyof typeof defaultDict
const dict: any = defaultDict

const lookup = (key: TemplateStringsArray | Key, ...subs: string[]): string => {
  let string: string | undefined = dict[key as string]
  if (string === undefined) logger.error(`missing string "${key}"`)

  let match: RegExpMatchArray | null | undefined
  let i = 0
  while (subs.length && (match = string?.match(new RegExp(`\\$${i++}`))))
    string =
      string!.slice(0, match.index) +
      subs.shift() +
      string!.slice(match.index! + match.length + 1)

  return string ?? (key as string)
}

const wrap =
  <T extends λ>(func: T, mod: (v: ReturnType<T>) => ReturnType<T>) =>
  (...args: Parameters<T>) =>
    mod(func(...args))

const strGetter = Object.assign(lookup, {
  c: wrap(lookup, v => v[0].toUpperCase() + v.slice(1)),
  or: (...keys: string[]) => orFormat.format(keys),
  count: (k: Key, n?: number | false) => {
    const w =
      Math.abs(n === false ? 0 : n ?? 0) === 1 ? lookup(k) : plural(lookup(k))
    return n === undefined || typeof n !== 'number' ? w : `${n} ${w}`
  },
})

const orFormat = new Intl.ListFormat('en', { type: 'disjunction' })

const plural = (word: string) => lookup(`@plural.${word}` as any) ?? word

declare global {
  // eslint-disable-next-line no-var
  var $: typeof strGetter
}

globalThis.$ = strGetter
