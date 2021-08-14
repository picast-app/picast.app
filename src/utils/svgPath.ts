import { clamp, vec } from 'utils/math'
import { atWrap } from 'utils/array'

type Vertex = vec.Vec2D
type Path = { path: Vertex[]; rounded?: Record<number, number> }

export const path = ({ path, rounded = {} }: Path): string => {
  const verts: vec.Vec2D[] = [...path]
  const org: vec.Vec2D[] = [...path]
  let d = ''
  let trailingQ = ''

  for (let i = 0; i < verts.length; i++) {
    let next = atWrap(org, i + 1)
    let last = atWrap(org, i - 1)
    if (vec.equal(verts[i], next)) next = atWrap(org, i + 2)
    if (vec.equal(verts[i], last)) last = atWrap(org, i - 2)

    let Q = ''
    if (i in rounded) {
      let r = rounded[i]

      // reduce artifacts from overlapping curves
      r = vec.smallerMag(vec.sub(next, org[i]), r)
      r = vec.smallerMag(vec.sub(last, org[i]), r)

      const corner: vec.Vec2D = [...org[i]]
      const c0 = vec.add(org[i], vec.mult(vec.normal(vec.sub(last, org[i])), r))
      const c1 = vec.add(corner, vec.mult(vec.normal(vec.sub(next, corner)), r))
      const q = ` Q ${corner[0]} ${corner[1]}, ${c1[0]} ${c1[1]}`

      if (i > 0) {
        verts[i] = c0
        Q = q
      } else {
        verts[i] = vec.add(
          corner,
          vec.mult(vec.normal(vec.sub(next, corner)), r)
        )
        trailingQ = ` L ${c0[0]} ${c0[1]}` + q
      }
    }

    if (i === 0) d = `M ${verts[i][0]} ${verts[i][1]}`
    else d += ` L ${verts[i][0]} ${verts[i][1]}` + Q
  }

  return d + trailingQ
}

export type Interpolated = (n: number) => string

export const interpolated = (a: Path, b: Path): Interpolated => {
  logger.assert(a.path.length === b.path.length, 'paths must have same length')

  return (n: number) => {
    n = clamp(0, n, 1)
    let v: Path = { path: [] }
    if (n === 0) v = a
    else if (n === 1) v = b
    else {
      for (let i = 0; i < a.path.length; i++) {
        if ((a.rounded && i in a.rounded) || (b.rounded && i in b.rounded)) {
          const ra = (a.rounded ?? {})[i] ?? 0
          const rb = (b.rounded ?? {})[i] ?? 0
          ;(v.rounded ??= {})[i] = ra + (rb - ra) * n
        }
        v.path.push(
          vec.add(a.path[i], vec.mult(vec.sub(b.path[i], a.path[i]), n))
        )
      }
    }

    return path(v)
  }
}

export const translate = (path: vec.Vec2D[], off: vec.Vec2D): vec.Vec2D[] =>
  path.map(v => vec.add(v, off))

export const scale = (path: vec.Vec2D[], [x, y]: vec.Vec2D): vec.Vec2D[] =>
  path.map(([vx, vy]) => [vx * x, vy * y])
