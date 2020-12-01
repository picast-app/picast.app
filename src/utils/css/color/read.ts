import { style } from 'styles/jsUtil'
import { parse } from './parse'

type ColorName = 'background' | 'surface' | 'text' | 'primary' | 'surface-alt'

export const read = (name: ColorName) =>
  parse(style().getPropertyValue(`--cl-${name}`))
