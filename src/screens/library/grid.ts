export const cardPadd = 1.5 * 16
export const sideBarWidth = 15 * 16

const maxWidth = (
  columns: number,
  maxCardSize: number,
  padding: number,
  sidePadd: number
) => columns * maxCardSize + (columns - 1) * padding + 2 * padding + sidePadd

export const DESKTOP_MIN_WIDTH = 901

export const desktopPts = Array(10)
  .fill(3)
  .map((v, i) => v + i)
  .map(columns => [
    Math.max(
      maxWidth(columns - 1, 256, cardPadd, sideBarWidth),
      DESKTOP_MIN_WIDTH
    ),
    columns,
  ])

const mobileBreaks = Array(4)
  .fill(3)
  .map((v, i) => v + i)
  .map(columns => maxWidth(columns - 1, 180, 0, 0))
  .filter(v => v < DESKTOP_MIN_WIDTH - 1)

type Query = [query: string, columns: number, size?: string]

export const mobileQueries: Query[] = mobileBreaks.map((v, i, { length }) => [
  `@media (min-width: ${v}px)` +
    (i < length - 1 ? '' : ` and (max-width: ${DESKTOP_MIN_WIDTH - 1}px)`),
  3 + i,
])

export const desktopQueries: Query[] = desktopPts.map(([size, columns]) => [
  `@media (min-width: ${size}px)`,
  columns,
  `calc((100vw - ${sideBarWidth}px - ${
    columns + 1
  } * ${cardPadd}px) / ${columns})`,
])
