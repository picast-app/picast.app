import { clamp, vec } from 'utils/math'

type Vertex = vec.Vec2D
type Path = { path: Vertex[]; rounded?: Record<number, number> }

export const path = ({ path, rounded = {} }: Path): string => {
  const verts: vec.Vec2D[] = [...path]
  const org: vec.Vec2D[] = [...path]
  let d = ''
  let trailingQ = ''

  for (let i = 0; i < verts.length; i++) {
    const next = org[(i + 1) % org.length]
    const last = org[(org.length + (i - 1)) % org.length]

    let Q = ''
    if (i in rounded) {
      const corner: vec.Vec2D = [...org[i]]
      const c0 = vec.add(
        org[i],
        vec.mult(vec.normal(vec.sub(last, org[i])), rounded[i])
      )
      const c1 = vec.add(
        corner,
        vec.mult(vec.normal(vec.sub(next, corner)), rounded[i])
      )
      const q = ` Q ${corner[0]} ${corner[1]}, ${c1[0]} ${c1[1]}`

      if (i > 0) {
        verts[i] = c0
        Q = q
      } else {
        verts[i] = vec.add(
          corner,
          vec.mult(vec.normal(vec.sub(next, corner)), rounded[i])
        )
        trailingQ = ` L ${c0[0]} ${c0[1]}` + q
      }
    }

    if (i === 0) d = `M ${verts[i][0]} ${verts[i][1]}`
    else d += ` L ${verts[i][0]} ${verts[i][1]}` + Q
  }

  return d + trailingQ
}

export const interpolated = (a: Path, b: Path) => {
  logger.assert(a.path.length === b.path.length, 'paths must have same length')

  return {
    at(n: number): string {
      n = clamp(0, n, 1)

      let v: Path = { path: [] }
      if (n === 0) v = a
      else if (n === 1) v = b
      else {
        for (let i = 0; i < a.path.length; i++)
          v.path.push(
            vec.add(a.path[i], vec.mult(vec.sub(b.path[i], a.path[i]), n))
          )
      }

      return path(v)
    },
  }
}
