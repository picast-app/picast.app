import React, { useState } from 'react'
import styled from 'styled-components'
import { scComp } from 'utils/react'
import * as cl from 'utils/css/color'

type Props = { onDrop?(file: File): void; for?: string }

export const Dropzone = scComp(
  (p: React.PropsWithChildren<Props>, Zone) => {
    const [hovered, setHovered] = useState(false)

    return (
      <Zone
        onDragEnter={() => setHovered(true)}
        onDragLeave={() => setHovered(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.items[0].getAsFile()
          if (file) p.onDrop?.(file)
        }}
        {...(hovered && { 'data-hovered': '' })}
      >
        <span>
          Drag &amp; drop or <label htmlFor={p.for}>select a file</label>
        </span>
      </Zone>
    )
  },
  styled.div`
    min-width: 5rem;
    min-height: 5rem;
    border: 0.15rem dashed var(--cl-primary);
    background-color: ${cl.format.hex(cl.alpha(cl.read('primary'), 0x18))};
    transition: background-color 0.2s ease;
    display: flex;
    justify-content: space-around;
    align-items: center;

    &[data-hovered] {
      background-color: ${cl.format.hex(cl.alpha(cl.read('primary'), 0x08))};
    }

    span {
      color: var(--cl-text);
      display: block;
      opacity: 0.8;
    }

    label {
      color: var(--cl-primary);
      text-decoration: underline;
      cursor: pointer;
    }
  `
)
