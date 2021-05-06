import React from 'react'
import Section from './Section'
import { Link } from '@picast-app/router'

export default function About() {
  return (
    <Section title={$`build`}>
      <span>{$`branch`}</span>
      <span>{process.env.BRANCH}</span>
      <span>{$`commit`}</span>
      <Link
        to={`https://github.com/picast-app/picast.app/commit/${process.env.COMMIT}`}
      >
        {process.env.COMMIT}
      </Link>
    </Section>
  )
}
