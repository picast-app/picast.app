import React from 'react'
import { Container } from './Container'
import { Core } from './Core'

import type { RouteProps } from '@picast-app/router'

const Info: React.FC<RouteProps> = ({ query }) => (
  <Container>
    <Core id={(query.info as string).split('-') as any} />
  </Container>
)

export default Info
