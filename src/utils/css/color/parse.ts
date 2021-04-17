import { expandHex } from './format'
import named, { ColorName } from './named'
import { compose, hsla } from './channels'
import { clamp } from 'utils/math'

export const parseHex = (v: string): RGBA => parseInt(v.slice(1), 16)

export const parseAngle = (v: string): number => {
  v = v.toLocaleLowerCase()
  const unit = v.match(/[a-z]+(?=$)/)?.[0]
  if (!unit) return parseFloat(v)
  const n = parseFloat(v.slice(0, unit.length))
  if (unit === 'deg') return n
  if (unit === 'turn') return n * 360
  if (unit === 'rad') return n * (180 / Math.PI)
  throw Error(`unknown angular unit "${v}"`)
}

export const parse = (v: string): RGBA => {
  v = v.trim()
  if (v.startsWith('#')) return parseHex(expandHex(v))
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
      ].map(v => clamp(0, v * 255, 255)) as RGBA_)
    )
  }
  if (/hsla?/.test(func)) {
    const [h, s, l, a = '1'] = parts
    return hsla(
      parseAngle(h) / 360,
      parseFloat(s) / 100,
      parseFloat(l) / 100,
      parseFloat(a)
    )
  }
  throw Error(`failed to parse "${v}" as color`)
}
