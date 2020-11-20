import { style } from 'styles/jsUtil'
import { parse } from './parse'

type ColorName = 'background' | 'surface' | 'text' | 'primary'

export const read = (name: ColorName) =>
  parse(style().getPropertyValue(`--cl-${name}`))
