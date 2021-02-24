import { crc32 } from 'crc'

export const hashIds = (ids: string[]): string =>
  crc32(ids.sort().join('')).toString(36)

export const encodeIds = (ids: string[]): string => {
  const encoded = []
  for (let i = 0; i < Math.max(...ids.map(id => id.length)); i++) {
    const column = []
    let n = 0
    let last
    for (const id of ids) {
      if ((id[i] ?? '_') !== last) {
        if (n && last)
          column.push(n > 3 ? `.${n.toString(16)}.${last}` : last.repeat(n))
        n = 0
        last = id[i] ?? '_'
      }
      n++
    }
    if (n && last)
      column.push(n > 3 ? `.${n.toString(16)}.${last}` : last.repeat(n))
    encoded.push(column.join(''))
  }

  return encoded.join(',')
}
