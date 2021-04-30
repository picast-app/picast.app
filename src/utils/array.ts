export const wrapped = <T>(arr: T[], i: number): T =>
  arr[i >= 0 ? i % arr.length : (arr.length + i) % arr.length]

export const min = <T>(list: T[], sel: (el: T) => number): T => {
  if (list.length <= 1) return list[0]
  let candidate = list[0]
  let candidateN = sel(list[0])

  for (let i = 1; i < list.length; i++) {
    const n = sel(list[i])
    if (n < candidateN) {
      candidateN = n
      candidate = list[i]
    }
  }

  return candidate
}
