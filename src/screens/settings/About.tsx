import React from 'react'
import Section from './Section'
import { Link } from 'components/atoms'

export default function About() {
  return (
    <Section title="Build">
      <span>Branch</span>
      <span>{process.env.BRANCH}</span>
      <span>Commit</span>
      <Link
        to={`https://github.com/picast-app/picast.app/commit/${process.env.COMMIT}`}
      >
        {process.env.COMMIT}
      </Link>
    </Section>
  )
}
