import React from 'react'
import styled from 'styled-components'
import { mobile } from 'app/styles/responsive'
import Skip from './SkipControl'
import { PlayButton } from 'app/components/atoms'
import { useStateX } from 'app/hooks'
import { main } from 'app/workers'

type Props = { slot?: string; round?: boolean }

const PlayControls: React.FC<Props> = ({ round = false, ...props }) => {
  const [state] = useStateX('player.status')

  function toggle() {
    if (!state) return
    if (state === 'paused') main.player$start()
    else main.player$stop()
  }

  return (
    <SC {...props}>
      <Skip ms={-15000} onJump={main.player$jumpBy} />
      <PlayButton
        playing={!!state && state !== 'paused'}
        onPress={toggle}
        round={round}
      />
      <Skip ms={30000} onJump={main.player$jumpBy} />
    </SC>
  )
}
export default PlayControls

const SC = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  --pb-size: 3rem;

  & > button[data-wrap] {
    --size: var(--pb-size);
    width: var(--size);
    height: var(--size);
  }

  button[data-wrap='plain'] {
    margin: 0 0.5rem;
    --size: calc(var(--pb-size) * 1.3);
  }

  button[data-wrap='round'] {
    margin: 0 0.8rem;
  }

  @media ${mobile} {
    & > * {
      transform: scale(0.8);
    }
  }
`

export const ControlsSC = SC
