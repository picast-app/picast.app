import { split } from './channels'

export const hex = (color: RGBA): string =>
  `#${split(color)
    .map(n => `0${n.toString(16)}`.slice(-2))
    .join('')}`.toUpperCase()

export const expandHex = (hex: string): string => {
  hex = hex.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (!/^[0-9a-f]+$/i.test(hex)) throw new Error(`invalid hex code ${hex}`)

  if ([3, 4].includes(hex.length)) hex = hex.replace(/./g, c => c.repeat(2))
  if (hex.length === 6) hex += 'ff'
  if (hex.length === 8) return `#${hex.toUpperCase()}`
  throw new Error(`invalid hex code #${hex}`)
}
