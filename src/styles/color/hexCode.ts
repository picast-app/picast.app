export const expand = (hex: string) => {
  hex = hex.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (!/^[0-9a-f]+$/i.test(hex)) throw new Error(`invalid hex code ${hex}`)

  if ([3, 4].includes(hex.length)) hex = hex.replace(/./g, c => c.repeat(2))
  if (hex.length === 6) hex += 'ff'
  if (hex.length === 8) return `#${hex.toUpperCase()}`
  throw new Error(`invalid hex code #${hex}`)
}

export const channels = (
  rgba: number
): [r: number, g: number, b: number, a: number] => {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >> 8) & 0xff
  const a = rgba & 0xff
  return [r, g, b, a]
}

export const compose = (r: number, g: number, b: number, a: number): number =>
  (r << 24) + (g << 16) + (b << 8) + a

export const parse = (hexCode: string, format = false) =>
  parseInt((format ? expand(hexCode) : hexCode).slice(1), 16)

export const encode = (color: number) =>
  `#${channels(color)
    .map(n => `0${n.toString(16)}`.slice(-2))
    .join('')}`.toUpperCase()
