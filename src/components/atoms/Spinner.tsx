import React from 'react'
import styled from 'styled-components'

export const Spinner: React.FC<{ color?: string }> = ({ color }) => {
  return (
    <SC data-active={true} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="20"
        strokeDashoffset={0.5 * 81.68141 * -1}
        {...(color && { style: { stroke: color } })}
      />
    </SC>
  )
}

const SC = styled.svg`
  width: 5rem;
  height: 5rem;
  animation: rotate 2s linear infinite;
  transition: opacity 0.15s ease;
  transform-origin: center;

  &[data-active='false'] {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  circle {
    fill: transparent;
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
    stroke-width: 6;
    stroke-linecap: round;
    stroke: var(--cl-primary);
    animation: progress 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes progress {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35px;
    }
    100% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124px;
    }
  }
`
