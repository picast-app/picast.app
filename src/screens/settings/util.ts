import { pick } from 'utils/path'

export const stateToggle =
  (base: string, state: any, set: (path: any, v: any) => any) =>
  (path: string) => {
    const checked = pick(state, path) as boolean
    return {
      checked,
      onChange() {
        set(`${base}.${path}` as any, !checked)
      },
    }
  }
