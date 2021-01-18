import React, { useState } from 'react'
import styled from 'styled-components'

type Props = {
  src?: string | null
  title?: string
  onClick?: () => void
  lazy?: boolean
  maxSize?: number
}

export function Artwork({
  src,
  title = '',
  onClick,
  lazy = true,
  maxSize = 256 * devicePixelRatio,
}: Props) {
  const [imgSrc, setImgSrc] = useState(
    src && `${process.env.PHOTON_ENDPOINT}/${maxSize}/${src}`
  )

  return (
    <S.Artwork onClick={onClick}>
      {imgSrc && (
        <>
          <source srcSet={imgSrc} />
        </>
      )}
      <img
        width={200}
        height={200}
        alt={title}
        src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        loading={lazy ? 'lazy' : 'eager'}
        onError={() => {
          if (imgSrc?.startsWith(process.env.PHOTON_ENDPOINT!)) setImgSrc(src)
        }}
      />
    </S.Artwork>
  )
}

const S = {
  Artwork: styled.picture`
    height: auto;
    max-width: 100%;
    flex-shrink: 0;
    display: block;

    img {
      width: 100%;
      height: 100%;
    }
  `,
}
