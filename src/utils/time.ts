export const splitDur = (
  seconds: number
): [seconds: number, minutes: number, hours: number] => [
  seconds % 60 | 0,
  (seconds / 60) % 60 | 0,
  (seconds / 3600) | 0,
]

export const formatDuration = (sec: number, sign = sec >= 0 ? '' : '-') => {
  const [s, m, h] = splitDur(Math.abs(sec))
  const ms = [m, s].map(v => `0${v}`.slice(-2)).join(':')
  if (!h) return sign + ms
  return `${sign}${h}:${ms}`
}

// https://www.w3.org/TR/2014/REC-html5-20141028/infrastructure.html#valid-duration-string
export const durAttr = (sec: number) => {
  const [s, m, h] = splitDur(Math.abs(sec))
  return `PT${h}H${m}M${s}S`
}

export const log = () => {
  const date: any = new Date()
  const ts = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`
  try {
    return ts.replace(/(?<=^|:)(\d)(?!\d)/g, '0$1')
  } catch {
    return ts
  }
}
