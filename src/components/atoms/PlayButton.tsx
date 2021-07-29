import React, { useState, useRef } from 'react'
import { useChanged } from 'hooks'
import styled from 'styled-components'
import { interpolated, Interpolated, translate, scale } from 'utils/svgPath'
import { vec, equiTriBoxRatio } from 'utils/math'
import { easeInOutSine as ease } from 'utils/ease'

type Props = {
  playing: boolean
  onPress(): void
  round?: boolean
}

export function PlayButton({ playing, onPress, round = false }: Props) {
  const [initial] = useState(+!playing)
  const svgRef = useRef<SVGSVGElement>(null)
  const cancelAnim = useRef<() => void>()
  const animState = useRef<number>(initial)

  const paths = geometry[round ? 'enclosed' : 'open']

  useChanged(() => {
    if (!svgRef.current) return
    cancelAnim.current?.()
    cancelAnim.current = transition(
      ['pbl', 'pbr'].map(
        id => svgRef.current!.getElementById(id) as SVGPathElement
      ),
      +!playing,
      animState,
      paths
    )
  }, [playing, paths])

  return (
    <Button
      onClick={onPress}
      data-wrap={round ? 'round' : 'plain'}
      title={playing ? 'pause' : 'play'}
    >
      <SVG viewBox="0 0 100 100" ref={svgRef}>
        {round && <circle cx="50" cy="50" r="50" />}
        <path d={paths[0](initial)} id="pbl" />
        <path d={paths[1](initial)} id="pbr" />
      </SVG>
    </Button>
  )
}

function transition(
  paths: SVGPathElement[],
  target: number,
  state: React.MutableRefObject<number>,
  geometry: [Interpolated, Interpolated]
) {
  const start = performance.now()
  const dur = 150
  const span = target - state.current
  const init = state.current
  if (span === 0) return

  const step = () => {
    const dt = Math.min((performance.now() - start) / dur, 1)
    const n = (state.current = init + ease(dt) * span)
    if (dt) paths.forEach((path, i) => path.setAttribute('d', geometry[i](n)))
    if (dt < 1) rafId = requestAnimationFrame(step)
  }

  let rafId = requestAnimationFrame(step)
  return () => cancelAnimationFrame(rafId)
}

const geometry = {
  open: calcPaths(),
  enclosed: calcPaths({
    triCent: 1 / 3,
    barOff: 0.13,
    barW: 0.15,
    triH: 0.5,
    triW: equiTriBoxRatio(0.5),
  }),
}

type GeoOpts = {
  vp: [number, number]
  triW: number
  triH: number
  barW: number
  barH: number
  triCent: number
  barOff: number
  barCR: number
  triCR: number
}

function calcPaths({
  vp = [100, 100],
  triH = 0.6,
  triW = equiTriBoxRatio(triH),
  barW = 0.35 * triW,
  barH = triH * 0.9,
  triCent = 4 / 9,
  barOff = triCent / 2 - barW / 2,
  barCR = 0.5 * barW,
  triCR = 0.8 * barCR,
}: Partial<GeoOpts> = {}): [Interpolated, Interpolated] {
  const triDiv = 0.45

  const baseTri: vec.Vec2D[] = [
    [0.5 - triW * triCent, 0.5 - triH / 2],
    [0.5 + triW * (1 - triCent), 0.5],
    [0.5 - triW * triCent, 0.5 + triH / 2],
  ]

  const leftTri: vec.Vec2D[] = [
    baseTri[0],
    vec.add(
      baseTri[0],
      vec.mult(vec.sub(baseTri[1], baseTri[0]), triDiv + 0.02)
    ),
    vec.add(
      baseTri[2],
      vec.mult(vec.sub(baseTri[1], baseTri[2]), triDiv + 0.02)
    ),
    baseTri[2],
  ]

  const rightTri: vec.Vec2D[] = [
    vec.add(baseTri[0], vec.mult(vec.sub(baseTri[1], baseTri[0]), triDiv)),
    baseTri[1],
    baseTri[1],
    vec.add(baseTri[2], vec.mult(vec.sub(baseTri[1], baseTri[2]), triDiv)),
  ]

  const bar: vec.Vec2D[] = [
    [0.5 - barW / 2, 0.5 - barH / 2],
    [0.5 + barW / 2, 0.5 - barH / 2],
    [0.5 + barW / 2, 0.5 + barH / 2],
    [0.5 - barW / 2, 0.5 + barH / 2],
  ]

  triCR *= vp[0]
  barCR *= vp[0]
  const barRound = { 0: barCR, 1: barCR, 2: barCR, 3: barCR }

  const pathA = interpolated(
    { path: scale(translate(bar, [-barOff, 0]), vp), rounded: barRound },
    { path: scale(leftTri, vp), rounded: { 0: triCR, 3: triCR } }
  )
  const pathB = interpolated(
    { path: scale(translate(bar, [barOff, 0]), vp), rounded: barRound },
    { path: scale(rightTri, vp), rounded: { 1: triCR, 2: triCR } }
  )

  return [pathA, pathB]
}

const Button = styled.button`
  padding: 0;
  border: none;
  border-radius: unset;
  display: block;
  --size: 3rem;
  width: var(--size);
  height: var(--size);
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

  [data-wrap='round'] > & > path {
    fill: var(--cl-background);
  }

  circle {
    fill: var(--cl-icon);
  }
`
