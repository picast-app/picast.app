// @ts-nocheck
export const expand = (hex: string) => {
  hex = hex.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (!/^[0-9a-f]+$/i.test(hex)) throw new Error(`invalid hex code ${hex}`)

  /* eslint-disable no-fallthrough */
  switch (hex.length) {
    case 3:
    case 4:
      hex = hex.replace(/./g, c => c.repeat(2))
    case 6:
      hex = hex + 'ff'
    case 8:
      return `#${hex.toUpperCase()}`
    default:
      throw new Error(`invalid hex code #${hex}`)
  }
  /* eslint-enable no-fallthrough */
}

export const comps = (
  rgba: number
): [r: number, g: number, b: number, a: number] => {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >> 8) & 0xff
  const a = rgba & 0xff
  return [r, g, b, a]
}

export const parse = (hexCode: string) => parseInt(hexCode.slice(1), 16)

export const encode = (color: number) =>
  `#${comps(color)
    .map(n => `0${n.toString(16)}`.slice(-2))
    .join('')}`.toUpperCase()
