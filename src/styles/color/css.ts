import { style } from '../jsUtil'
import { expand, parse } from './hexCode'

type ColorName = 'background' | 'surface' | 'text'

export const color = (name: ColorName) =>
  parse(expand(style().getPropertyValue(`--cl-${name}`)))
