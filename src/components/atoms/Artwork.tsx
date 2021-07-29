import React, { useState } from 'react'
import styled from 'styled-components'
import { useComputed } from 'hooks'
import { mobile } from 'styles/responsive'

type Size = [query: string, size: number] | number

type Props = {
  src?: string | null
  title?: string
  onClick?: () => void
  lazy?: boolean
  maxSize?: number
  covers?: string[] | null
  sizes?: Size[]
}

const typePrio = ['webp', 'jpeg'] as const
type Type = typeof typePrio[number]

type ByType = { [K in Type]: [number, string][] }

export function Artwork({
  src,
  title = '',
  onClick,
  lazy = true,
  maxSize = 256 * devicePixelRatio,
  covers,
  sizes = [[mobile, 180], 256],
}: Props) {
  const [imgSrc, setImgSrc] = useState(
    src && `${process.env.PHOTON_ENDPOINT}/${maxSize}/${src}`
  )

  const byType = useComputed(covers, covers => {
    if (!covers?.length) return
    const dict: Partial<ByType> = {}
    for (const name of covers) {
      const [sizeStr, type] = name.split('-').pop()?.split('.')! as [
        string,
        Type
      ]
      const size = parseInt(sizeStr)
      if (!(type in dict)) dict[type] = []

      const next = dict[type]!.findIndex(([n]) => n < size)
      dict[type]!.splice(next === -1 ? dict[type]!.length : next, 0, [
        size,
        `${process.env.IMG_HOST}/${name}`,
      ])
    }
    return dict
  })

  const getSize = (min: number, type: Type) => {
    for (let i = byType![type]!.length - 1; i >= 0; i--)
      if (byType![type]![i][0] >= min) return byType![type]![i][0]
  }

  const getSrc = (size: number, type: Type) =>
    byType![type]!.find(([n]) => n === size)?.[1]

  const getSrcs = (size: number, type: Type) =>
    Array(2)
      .fill(0)
      .map((_, i) => {
        const v = i === 0 ? size : getSize(size * (i + 1), type)
        return v ? getSrc(v, type) : undefined
      })
      .map((v, i) => v && v + (i === 0 ? '' : ` ${i + 1}x`))
      .filter(Boolean)
      .join(', ')

  const sources = useComputed(byType, v => {
    if (!sizes || !byType) return
    return typePrio.flatMap(type => {
      if (!byType[type]?.length) return []

      const list = sizes.map(
        v =>
          [
            getSize(typeof v === 'number' ? v : v[1], type),
            typeof v === 'number' ? undefined : v[0],
          ] as [number, string | undefined]
      )
      while (
        list.length >= 2 &&
        !list[list.length - 1][1] &&
        list[list.length - 2][0] === list[list.length - 1][0]
      )
        list.splice(list.length - 2, 1)

      const sources = list.map(([size, media]) => ({
        media,
        srcSet: getSrcs(size, type),
      }))

      return sources.map(attrs => (
        <source type={`image/${type}`} {...attrs} key={type + attrs.media} />
      ))
    })
  })

  return (
    <S.Artwork onClick={onClick}>
      {sources}
      {imgSrc && !sources?.length && <source srcSet={imgSrc} />}
      <img
        width={200}
        height={200}
        alt={title}
        src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
        loading={lazy ? 'lazy' : 'eager'}
        {...(!IS_LOCAL && covers?.length && { crossOrigin: 'use-credentials' })}
        onError={() => {
          if (
            !covers?.length &&
            imgSrc?.startsWith(process.env.PHOTON_ENDPOINT!)
          )
            setImgSrc(src)
        }}
      />
    </S.Artwork>
  )
}

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname)

const S = {
  Artwork: styled.picture`
    height: auto;
    max-width: 100%;
    flex-shrink: 0;
    display: block;

    img {
      width: 100%;
      height: 100%;
      background-color: var(--cl-border-light);
    }
  `,
}
