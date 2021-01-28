import type { Snack } from 'components/structure'

export const snack = (detail: Snack) => {
  window.dispatchEvent(
    new CustomEvent<EchoSnackEvent['detail']>('echo_snack', {
      detail,
    })
  )
}
