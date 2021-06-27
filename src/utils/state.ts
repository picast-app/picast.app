export const flag = (): [flag: boolean, set: () => void] => {
  let val = false
  const setter = () => {
    val = true
  }
  return [val, setter]
}
