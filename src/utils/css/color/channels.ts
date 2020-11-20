export const compose = (...ch: RGBA_): RGBA => {
  const [r, g, b, a] = ch.map(v => Math.max(Math.min(Math.round(v), 0xff), 0))
  return (r << 24) + (g << 16) + (b << 8) + a
}

export const split = (
  rgba: RGBA
): [r: number, g: number, b: number, a: number] => {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >> 8) & 0xff
  const a = rgba & 0xff
  return [r, g, b, a]
}

export const hsla = (h: number, s: number, l: number, a: number): RGBA => {
  let r, g, b
  if (s === 0) r = g = b = l
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return compose(...([r, g, b, a].map(v => v * 0xff) as RGBA_))
}
