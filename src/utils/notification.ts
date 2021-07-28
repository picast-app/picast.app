import type { Snack } from 'app/components/structure'

export const snack = (detail: Snack) => {
  window.dispatchEvent(
    new CustomEvent<EchoSnackEvent['detail']>('echo_snack', {
      detail,
    })
  )
}
