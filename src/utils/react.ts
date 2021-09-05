import React from 'react'
import { StyledComponent } from 'styled-components'

type RC<T = any, S extends SC[] = any> = (
  props: Parameters<React.FunctionComponent<T>>[0],
  ...comps: S
) => ReturnType<React.FunctionComponent<T>>
type SC = StyledComponent<any, any>

const scMap = new Map<RC, SC>()

export const scComp = <P, T extends RC<P, S>, S extends [SC, ...SC[]]>(
  comp: T,
  ...scs: S
): T => {
  const wrapped = ((p: P) => comp(p, ...scs)) as any
  scMap.set(wrapped, scs[0])
  return wrapped
}

export const sc = (comp: RC) => scMap.get(comp)
