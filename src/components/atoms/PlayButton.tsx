import React, { useState, useRef } from 'react'
import { useChanged } from 'utils/hooks'
import styled from 'styled-components'
import { interpolated } from 'utils/svgPath'
import { vec } from 'utils/math'
import { easeInOutSine as ease } from 'utils/ease'

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
    <Button onClick={onPress}>
      <SVG viewBox="0 0 100 100" ref={svgRef}>
        <path d={pathA.at(initial)} id="pbl" />
        <path d={pathB.at(initial)} id="pbr" />
      </SVG>
    </Button>
  )
}

function transition(
  path0: SVGPathElement,
  path1: SVGPathElement,
  target: number,
  state: React.MutableRefObject<number>
) {
  const start = performance.now()
  const dur = 150
  const span = target - state.current
  const init = state.current
  if (span === 0) return

  const step = () => {
    const dt = Math.min((performance.now() - start) / dur, 1)
    const n = (state.current = init + ease(dt) * span)
    if (dt) {
      path0.setAttribute('d', pathA.at(n))
      path1.setAttribute('d', pathB.at(n))
    }
    if (dt < 1) rafId = requestAnimationFrame(step)
  }

  let rafId = requestAnimationFrame(step)
  return () => cancelAnimationFrame(rafId)
}

const triH = 75
const triW = (triH / 100) * 75
const barW = 20
const barH = triH * 0.9
const barOff = (triW / 3) * 2 - barW
const triCent = 2 / 5
const triDiv = 0.45

const baseTri: vec.Vec2D[] = [
  [50 - triW * triCent, 50 - triH / 2],
  [50 + triW * (1 - triCent), 50],
  [50 - triW * triCent, 50 + triH / 2],
]

const leftTri: vec.Vec2D[] = [
  baseTri[0],
  vec.add(baseTri[0], vec.mult(vec.sub(baseTri[1], baseTri[0]), triDiv + 0.01)),
  vec.add(baseTri[2], vec.mult(vec.sub(baseTri[1], baseTri[2]), triDiv + 0.01)),
  baseTri[2],
]

const rightTri: vec.Vec2D[] = [
  vec.add(baseTri[0], vec.mult(vec.sub(baseTri[1], baseTri[0]), triDiv)),
  baseTri[1],
  baseTri[1],
  vec.add(baseTri[2], vec.mult(vec.sub(baseTri[1], baseTri[2]), triDiv)),
]

const bar: vec.Vec2D[] = [
  [50 - barW / 2, 50 - barH / 2],
  [50 + barW / 2, 50 - barH / 2],
  [50 + barW / 2, 50 + barH / 2],
  [50 - barW / 2, 50 + barH / 2],
]

const transPath = (path: vec.Vec2D[], trans: vec.Vec2D) =>
  path.map(v => vec.add(v, trans))

const tr = 8
const barRound = { 0: 10, 1: 10, 2: 10, 3: 10 }

const pathA = interpolated(
  { path: transPath(bar, [-barOff, 0]), rounded: barRound },
  { path: leftTri, rounded: { 0: tr, 3: tr } }
)
const pathB = interpolated(
  { path: transPath(bar, [barOff, 0]), rounded: barRound },
  { path: rightTri, rounded: { 1: tr, 2: tr } }
)

const Button = styled.button`
  padding: 0;
  border: none;
  border-radius: unset;
  display: block;
  margin: 0 1rem;
  width: 3rem;
  height: 3rem;
  box-sizing: border-box;
  cursor: pointer;
  background-color: transparent;

  &:focus {
    outline: none;
  }
`

const SVG = styled.svg`
  width: 100%;
  height: 100%;

  path {
    fill: var(--cl-icon);
    stroke: none;
    will-change: d;
  }
`
