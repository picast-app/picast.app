import { style } from 'app/styles/jsUtil'
import { parse } from './parse'

type ColorName =
  | 'background'
  | 'surface'
  | 'text'
  | 'text-alt'
  | 'primary'
  | 'surface-alt'
  | 'border'

export const read = (name: ColorName) =>
  parse(style().getPropertyValue(`--cl-${name}`))
