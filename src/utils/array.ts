export const wrapped = <T>(arr: T[], i: number): T =>
  arr[i >= 0 ? i % arr.length : (arr.length + i) % arr.length]
