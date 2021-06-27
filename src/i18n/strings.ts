import defaultDict from 'strings/en.json'

type Key = keyof typeof defaultDict
const dict: any = defaultDict

const lookup = (key: TemplateStringsArray | Key): string => {
  const string = dict[key as string]
  if (string === undefined) logger.error(`missing string "${key}"`)
  return string ?? key
}

const wrap =
  <T extends λ>(func: T, mod: (v: ReturnType<T>) => ReturnType<T>) =>
  (...args: Parameters<T>) =>
    mod(func(...args))

const strGetter = Object.assign(lookup, {
  c: wrap(lookup, v => v[0].toUpperCase() + v.slice(1)),
  or: (...keys: string[]) => orFormat.format(keys),
})

const orFormat = new Intl.ListFormat('en', { type: 'disjunction' })

declare global {
  // eslint-disable-next-line no-var
  var $: typeof strGetter
}

globalThis.$ = strGetter
