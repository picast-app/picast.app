import React, { useEffect, useReducer, useState } from 'react'
import { Input } from 'components/atoms'
import { Screen } from 'components/structure'
import styled from 'styled-components'
import type AudioComp from 'components/webcomponents/audio.comp'
import { bundleSync } from 'utils/function'
import { atWrap } from 'utils/array'

const files = [
  'https://traffic.megaphone.fm/VMP4458584936.mp3',
  'https://traffic.megaphone.fm/GLT5036262853.mp3?updated=1614849302',
]

const time = () => {
  const date = new Date()
  return [date.getMinutes(), date.getSeconds(), date.getMilliseconds()]
    .map((v, i) => `000${v.toString()}`.slice(i < 2 ? -2 : -3))
    .join(':')
}

export default function Audio() {
  const [input, setInput] = useState(files[0])
  const [src, setSrc] = useState<string | null>(input)
  const [audio, setRef] = useState<AudioComp>()
  const [playing, setPlaying] = useState(false)
  const [logs, log] = useReducer(
    (logs: [string, string][], log: string | null) =>
      log ? [...logs, [time(), log] as [string, string]] : [],
    []
  )

  useEffect(
    () =>
      bundleSync(
        audio?.addEventListener('state', ({ detail: state }) =>
          setPlaying(state !== 'paused')
        ),
        audio?.addEventListener('event', ({ detail }) =>
          log(`event: ${detail}`)
        )
      ),
    [audio]
  )

  useEffect(() => log(`set src ${JSON.stringify(src)}`), [src])

  return (
    <Screen style={S.Page}>
      <S.Input>
        <Input value={input} onChange={setInput} />
        <button disabled={src === input} onClick={() => setSrc(input)}>
          set
        </button>
        <button
          onClick={() => setInput(atWrap(files, files.indexOf(input) + 1))}
        >
          ↓
        </button>
        <button onClick={() => setSrc(null)}>remove</button>
      </S.Input>
      <S.Controls>
        <button onClick={() => (playing ? audio!.pause() : audio!.play())}>
          {playing ? 'pause' : 'play'}
        </button>
      </S.Controls>
      <picast-audio src={src} ref={setRef} controls></picast-audio>
      <S.Logs>
        <button onClick={() => log(null)}>clear</button>
        {logs.map(([t, v], i) => (
          <li key={i}>
            <span>{t}</span>
            {v}
          </li>
        ))}
      </S.Logs>
    </Screen>
  )
}

const S = {
  Page: styled.div`
    padding: 2rem;
  `,

  Input: styled.div`
    display: flex;

    input {
      border: 1px solid #000;
      flex-grow: 1;
    }

    button {
      margin-left: 0.5rem;
    }
  `,

  Controls: styled.div`
    margin: 2rem 0;
  `,

  Logs: styled.ol`
    margin-top: 1rem;
    border: 1px solid #000;
    font-size: 14px;
    position: relative;

    button {
      position: absolute;
      right: 0;
    }

    li {
      padding: 0.3rem;

      span {
        font-size: 12px;
        font-family: monospace;
        white-space: pre;
      }

      span::after {
        content: '  ';
      }
    }

    li:nth-child(2n) {
      background-color: #eee;

      html[data-theme='dark'] & {
        background-color: #fff1;
      }
    }
  `,
}
