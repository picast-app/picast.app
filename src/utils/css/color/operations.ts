import { split, compose } from 'utils/css/color/channels'

export const blend = (background: number, foreground: number) => {
  const back = split(background)
  const front = split(foreground)
  const m = front[3] / 255
  return compose(
    back[0] + (front[0] - back[0]) * m,
    back[1] + (front[1] - back[1]) * m,
    back[2] + (front[2] - back[2]) * m,
    back[3]
  )
}

export const alpha = (color: number, a: number) => {
  const [r, g, b] = split(color)
  return compose(r, g, b, a)
}
