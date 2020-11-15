import { style } from '../jsUtil'
import * as hexCode from './hexCode'

type ColorName = 'background' | 'surface' | 'text'

export const color = (name: ColorName) =>
  hexCode.expand(style().getPropertyValue(`--cl-${name}`))
