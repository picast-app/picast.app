import React, { useState } from 'react'
import styled from 'styled-components'
import { Screen } from 'components/structure'
import {
  Title,
  Input,
  Switch,
  PlayButton,
  Button,
  Icon,
} from 'components/atoms'
import { ShowCard } from 'components/composite'
import { useComputed } from 'hooks'

export default function Components() {
  const [src, setSrc] = useState(
    'https://cdn.changelog.com/uploads/covers/the-changelog-original.png'
  )
  const podcast = useComputed(
    src,
    (artwork): ReactProps<typeof ShowCard>['podcast'] => ({
      id: 'bmJ0',
      title: 'The Changelog: Software Dev & Open Source',
      author: 'Changelog Media',
      feed: '',
      artwork,
      covers: [],
    })
  )
  const [playing, setPlaying] = useState(false)

  return (
    <Screen padd style={S.Page}>
      <Title h1>Components</Title>
      <S.Podcast>
        <Title h2>Podcast Card</Title>
        <Input value={src} onChange={setSrc} />
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
        <Title h2>Switch</Title>
        <Switch />
      </section>

      <section>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent<EchoSnackEvent['detail']>('echo_snack', {
                detail: {
                  text: 'There is an update available.',
                  action: 'reload',
                  actionEvent: 'echo_reload',
                },
              })
            )
          }
        >
          snack
        </button>
      </section>

      <section className="pb">
        <Title h2>Play Button</Title>
        <PlayButton playing={playing} onPress={() => setPlaying(!playing)} />
      </section>

      <S.Feedback>
        <Title h2>Button feedback</Title>
        <div>
          <Button feedback>text</Button>
          <Icon icon="cancel" onClick={() => {}} label="feedback" ripple />
        </div>
      </S.Feedback>
    </Screen>
  )
}

const S = {
  Page: styled.div`
    & > *:first-child {
      margin-top: 0;
    }

    section {
      padding: 2rem 0;
    }

    section:first-of-type {
      padding-top: 0;
    }

    .pb > button {
      width: 20rem;
      height: 20rem;
    }
  `,

  Podcast: styled.section`
    & > img {
      margin: 2rem 0;
    }
  `,

  Feedback: styled.section`
    & > div {
      display: flex;
    }

    button:not(:first-of-type) {
      margin-left: 2rem;
    }
  `,
}
