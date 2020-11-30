import React, { useState } from 'react'
import styled from 'styled-components'
import { Screen } from 'components/structure'
import { Title, Input, Artwork } from 'components/atoms'
import { ShowCard } from 'components/composite'
import { useComputed } from 'utils/hooks'

export default function Components() {
  const [src, setSrc] = useState(
    'https://cdn.changelog.com/uploads/covers/the-changelog-original.png'
  )
  const podcast = useComputed(src, (artwork): ReactProps<
    typeof ShowCard
  >['podcast'] => ({
    id: 'bmJ0',
    title: 'The Changelog: Software Dev & Open Source',
    author: 'Changelog Media',
    artwork,
  }))

  return (
    <Screen padd style={S.Page}>
      <Title h1>Components</Title>
      <S.Podcast>
        <Title h2>Podcast Card</Title>
        <Input value={src} onChange={setSrc} />
        <Artwork src={src} />
        <ShowCard podcast={podcast} card title />
      </S.Podcast>
      <section>
        <Title h1>Title h1</Title>
        <Title h2>Title h2</Title>
        <Title h3>Title h3</Title>
        <Title h4>Title h4</Title>
        <Title h5>Title h5</Title>
        <Title h6>Title h6</Title>

        <Title h1>Title h1</Title>
        <span>some text</span>
        <Title h2>Title h2</Title>
        <span>some text</span>
        <Title h3>Title h3</Title>
        <span>some text</span>
        <Title h4>Title h4</Title>
        <span>some text</span>
        <Title h5>Title h5</Title>
        <span>some text</span>
        <Title h6>Title h6</Title>
        <span>some text</span>
      </section>

      <section>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent<EchoSnackEvent['detail']>('echo_snack', {
                detail: {
                  text: 'There is an update available.',
                  action: 'reload',
                  timeout: 8,
                },
              })
            )
          }
        >
          snack
        </button>
      </section>
    </Screen>
  )
}

const S = {
  Page: styled.div`
    & > *:first-child {
      margin-top: 0;
    }

    input {
      width: 100%;
    }

    section {
      padding: 2rem 0;
    }

    section:first-of-type {
      padding-top: 0;
    }
  `,

  Podcast: styled.section`
    & > img {
      margin: 2rem 0;
    }
  `,
}
