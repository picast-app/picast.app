import React, { useState, useEffect } from 'react'
import Section from './Section'
import { Button } from 'components/atoms'
import { main } from 'workers'
import * as notify from 'utils/notification'
import * as wp from 'utils/webpush'

export default function Notifications() {
  const [granted, setGranted] = useState<PushSubscription | null>()

  useEffect(() => {
    wp.getSubscription().then(setGranted)
  }, [])

  async function grant() {
    const sw = await navigator.serviceWorker.ready
    try {
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VAPID_PUBLIC,
      })
      setGranted(sub)
      await main.wpSub(JSON.stringify(sub))
    } catch (e) {
      notify.snack({
        text: 'Failed to receive push notification permission.',
        lvl: 'error',
      })
      throw e
    }
  }

  async function revoke() {
    const sub = await wp.getSubscription()
    if (!sub) return
    await main.wpUnsub(JSON.stringify(sub))
    await sub.unsubscribe()
    setGranted(null)
  }

  if (granted === undefined) return null
  return (
    <Section title="Notifications">
      <label>Push Notification permission</label>
      <Button text onClick={granted ? revoke : grant}>
        {granted ? 'revoke' : 'grant'}
      </Button>
    </Section>
  )
}
