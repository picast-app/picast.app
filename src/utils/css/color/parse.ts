import { expandHex } from './format'
import named, { ColorName } from './named'
import { compose } from './channels'

export const parseHex = (v: string): RGBA => parseInt(v.slice(1), 16)

export const parse = (v: string): RGBA => {
  v = v.trim()
  if (v.startsWith(v)) return parseHex(expandHex(v))
  if (v in named) return named[v as ColorName]
  const [func, rest] = v.split('(')
  const parts = rest.split(/[\s,/]+/g)
  if (/rgba?/.test(func)) {
    const [r, g, b, a = '1'] = parts
    return compose(
      ...([
        ...[r, g, b].map(v =>
          v.endsWith('%')
            ? parseFloat(v.slice(0, -1)) / 100
            : parseFloat(v) / 255
        ),
        a.endsWith('%') ? parseFloat(v.slice(0, -1)) / 100 : parseFloat(a),
      ].map(v => Math.min(Math.max(v * 255, 0), 255)) as RGBA_)
    )
  }
  throw Error(`failed to parse "${v}" as color`)
}
