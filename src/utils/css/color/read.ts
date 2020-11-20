import { style } from 'styles/jsUtil'
import { expandHex } from './format'
import { parseHex } from './parse'

type ColorName = 'background' | 'surface' | 'text' | 'primary'

export const read = (name: ColorName) =>
  parseHex(expandHex(style().getPropertyValue(`--cl-${name}`)))
