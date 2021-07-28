import React from 'react'
import styled from 'styled-components'
import { useComputed } from 'app/hooks'
import * as color from 'app/utils/css/color'

type Props = {
  data: Datum[]
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  padd?: number
  ptR?: number
  scatter?: boolean
  line?: boolean
  lineWidth?: number
}

export function Plot({
  data,
  padd = 0,
  ptR,
  lineWidth,
  scatter,
  line,
  ...bounds
}: Props) {
  let xMin = useComputed(bounds.xMin ?? data, bound('min', 0), 'json')
  let xMax = useComputed(bounds.xMax ?? data, bound('max', 0), 'json')
  let yMin = useComputed(bounds.yMin ?? data, bound('min', 1), 'json')
  let yMax = useComputed(bounds.yMax ?? data, bound('max', 1), 'json')
  logger.assert(xMax >= xMin && yMax >= yMin)

  let width = xMax - xMin
  let height = yMax - yMin

  xMin -= width * padd
  xMax += width * padd
  yMin -= height * padd
  yMax += height * padd
  width += width * padd * 2
  height += height * padd * 2

  const cl = color.format.hex(
    color.blend(color.read('text'), color.alpha(color.read('background'), 0x44))
  )

  return (
    <S.Plot viewBox={`${xMin} ${yMin} ${width} ${height}`} fill={cl}>
      {scatter &&
        data.map(([x, y], i) => (
          <circle
            cx={x}
            cy={yMax - (y - yMin)}
            r={ptR ?? height / 200}
            key={`pt-${i}`}
          />
        ))}
      {line &&
        data.slice(0, -1).map((p1, i) => {
          const [x1, y1i] = p1
          const [x2, y2i] = data[i + 1]
          const [y1, y2] = [y1i, y2i].map(v => yMax - (v - yMin))
          return (
            <line
              {...{ x1, y1, x2, y2 }}
              key={`seg-${i}`}
              stroke={cl}
              stroke-width={lineWidth ?? height / 100}
            />
          )
        })}
    </S.Plot>
  )
}

export type Datum = [x: number, y: number]

const bound =
  (func: 'min' | 'max', i: number) =>
  (data: Datum[] | number): number =>
    typeof data === 'number' ? data : Math[func](...data.map(v => v[i]))

const S = {
  Plot: styled.svg<{ fill?: string }>`
    ${({ fill }) => `fill: ${fill ?? 'var(--cl-text)'};`}
  `,
}
