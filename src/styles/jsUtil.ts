import { Theme } from './context'

const styleCache: { [k: string]: CSSStyleDeclaration } = {}

export const style = (): CSSStyleDeclaration => {
  const theme = (Theme as any)._currentValue
  return (
    styleCache[theme] ??
    (styleCache[theme] = getComputedStyle(document.documentElement))
  )
}
