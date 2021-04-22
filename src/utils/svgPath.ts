import { clamp, vec } from 'utils/math'

type Vertex = vec.Vec2D

export const path = (verts: Vertex[]): string =>
  'M ' + verts.map(v => v.join(' ')).join(' L ')

export const interpolated = (a: Vertex[], b: Vertex[]) => {
  logger.assert(a.length === b.length, 'paths must have same length')

  return {
    at(n: number): string {
      n = clamp(0, n, 1)

      if (n === 0) return path(a)
      if (n === 1) return path(b)

      const verts: Vertex[] = []
      for (let i = 0; i < a.length; i++)
        verts.push(vec.add(a[i], vec.mult(vec.minus(b[i], a[i]), n)))

      return path(verts)
    },
  }
}
