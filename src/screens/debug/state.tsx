import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { main } from 'workers'
import { hashIds, encodeIds } from 'utils/encode'

export default function DebugState() {
  const [key, setKey] = useState(0)

  return (
    <Page>
      <button onClick={() => setKey(key + 1)}>refresh</button>
      <Info />
    </Page>
  )
}

function Info() {
  const [state, setState] = useState<any>()

  useEffect(() => {
    ;(async () => {
      const user = await main.getX('user')
      const podcasts = await main.getAll('podcasts')

      await Promise.all(
        podcasts.map(async pod => {
          pod.episodes = await main.getAllKeysFromIndex(
            'episodes',
            'podcast' as any,
            pod.id
          )
        })
      )

      setState({ user, podcasts })
    })()
  }, [])

  logger.info(state)

  if (!state) return null
  return (
    <div>
      <span>{new Date().toUTCString()}</span>
      <hr />
      <span>signed in: {(!!state.user).toString()}</span>
      <span>
        <details>
          <summary>subscriptions: [{state.user?.subscriptions.length}]</summary>
          <ul>
            {state.user?.subscriptions?.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </details>
      </span>
      <hr />
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>title</th>
            <th>episodes (count)</th>
            <th>meta check</th>
            <th>episodes (idb)</th>
            <th>episode crc</th>
          </tr>
        </thead>
        <tbody>
          {state.podcasts?.map((v: any) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td className="title">{v.title}</td>
              <td>{v.episodeCount}</td>
              <td>{v.check}</td>
              <td>{v.episodes?.length}</td>
              <td>
                <details>
                  <summary>{hashIds(v.episodes)}</summary>
                  <span>{encodeIds(v.episodes)}</span>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Page = styled.div`
  padding: 2rem;
  font-size: 14px;

  span {
    display: block;
    margin: 1rem 0;
  }

  table {
    border-spacing: 2rem 0.5rem;
    border-collapse: separate;
    white-space: nowrap;

    details > span {
      max-width: 50rem;
      overflow-x: hidden;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }

  th,
  td {
    text-align: left;
  }

  .title {
    max-width: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
