import React, { useState, useRef } from 'react'
import { useChanged } from 'utils/hooks'
import styled from 'styled-components'
import { interpolated } from 'utils/svgPath'
import { vec } from 'utils/math'
import { easeOutCirc } from 'utils/ease'

type Props = {
  playing: boolean
  onPress(): void
}

export function PlayButton({ playing, onPress }: Props) {
  const [initial] = useState(+!playing)
  const svgRef = useRef<SVGSVGElement>(null)
  const cancelAnim = useRef<() => void>()
  const animState = useRef<number>(initial)

  useChanged(() => {
    if (!svgRef.current) return
    cancelAnim.current?.()
    cancelAnim.current = transition(
      svgRef.current.getElementById('pbl') as SVGPathElement,
      svgRef.current.getElementById('pbr') as SVGPathElement,
      +!playing,
      animState
    )
  }, [playing])

  return (
    <SVG viewBox="0 0 100 100" onClick={onPress} ref={svgRef}>
      <path d={pathA.at(initial)} id="pbl" />
      <path d={pathB.at(initial)} id="pbr" />
    </SVG>
  )
}

function transition(
  path0: SVGPathElement,
  path1: SVGPathElement,
  target: number,
  state: React.MutableRefObject<number>
) {
  const start = performance.now()
  const dur = 200
  const span = target - state.current
  const init = state.current
  if (span === 0) return

  const step = () => {
    const dt = Math.min((performance.now() - start) / dur, 1)
    const n = (state.current = init + easeOutCirc(dt) * span)
    if (dt) {
      path0.setAttribute('d', pathA.at(n))
      path1.setAttribute('d', pathB.at(n))
    }
    if (dt < 1) rafId = requestAnimationFrame(step)
  }

  let rafId = requestAnimationFrame(step)

  return () => cancelAnimationFrame(rafId)
}

const baseTri: vec.Vec2D[] = [
  [0, 0],
  [75, 50],
  [0, 100],
]

const leftTri: vec.Vec2D[] = [
  baseTri[0],
  vec.add(baseTri[0], vec.mult(vec.minus(baseTri[1], baseTri[0]), 0.5)),
  vec.add(baseTri[1], vec.mult(vec.minus(baseTri[2], baseTri[1]), 0.5)),
  baseTri[2],
]

const rightTri: vec.Vec2D[] = [leftTri[1], baseTri[1], baseTri[1], leftTri[2]]

const bar: vec.Vec2D[] = [
  [0, 0],
  [20, 0],
  [20, 100],
  [0, 100],
]

const pathA = interpolated(bar, leftTri)
const pathB = interpolated(
  bar.map(v => vec.add(v, [50, 0])),
  rightTri
)

const SVG = styled.svg`
  width: 20rem;
  height: 20rem;

  path {
    fill: #f00;
    stroke: none;
  }
`
