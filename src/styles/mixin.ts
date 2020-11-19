import { desktop } from './responsive'

export const center = `
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
`

export const bar = `
  position: fixed;
  left: 0;
  width: 100%;
  height: var(--bar-height);

  @media ${desktop} {
    left: var(--sidebar-width);
    width: calc(100vw - var(--sidebar-width));
  }
`

export const lineClamp = (lines: number) => `
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${lines};
`
