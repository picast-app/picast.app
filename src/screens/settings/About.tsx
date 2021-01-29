import React from 'react'
import Section from './Section'

export default function About() {
  return (
    <Section title="Build">
      <span>Branch</span>
      <span>{process.env.BRANCH}</span>
      <span>Commit</span>
      <span>{process.env.COMMIT}</span>
    </Section>
  )
}
