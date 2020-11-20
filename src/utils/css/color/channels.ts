export const compose = (r: number, g: number, b: number, a: number): RGBA =>
  (r << 24) + (g << 16) + (b << 8) + a

export const split = (
  rgba: RGBA
): [r: number, g: number, b: number, a: number] => {
  const r = (rgba >> 24) & 0xff
  const g = (rgba >> 16) & 0xff
  const b = (rgba >> 8) & 0xff
  const a = rgba & 0xff
  return [r, g, b, a]
}
