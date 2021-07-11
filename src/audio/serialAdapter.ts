import type Audio from 'components/webcomponents/audio.comp'
import type { Events as AudioEvent } from 'components/webcomponents/audio.comp'
import { main } from 'workers'
import { proxy, release } from 'fiber'
import { callAll } from 'utils/function'
import { remove } from 'utils/array'
import store from 'store/uiThread/api'

export default () => {
  let audio: Audio | null = null
  const onAudioChange: λ<[Audio | null]>[] = []

  const onCleanup: (λ | undefined)[] = []
  const clean = <T extends λ>(f: T): T => {
    const wrapped = proxy(f)
    onCleanup.push(wrapped[release])
    return wrapped
  }

  const waitForSrc = (src: string | null) =>
    new Promise<void>(res => {
      const cancel = () => {
        audio?.removeEventListener('src', onChange as any)
        remove(onCleanup, cancel)
        remove(onAudioChange, audioChange)
      }

      async function audioChange() {
        cancel()
        await waitForSrc(src)
        res()
      }

      onAudioChange.push(audioChange)
      if (!audio) return

      if (audio.src === src) return res()
      const onChange = ({ detail }: CustomEvent<string | null>) => {
        if (detail !== src) return
        cancel()
        res()
      }
      audio.addEventListener('src', onChange)
      onCleanup.push(cancel)
    })

  let volume: number | undefined
  let muted = false

  onCleanup.push(
    store.listenX('player.volume', v => {
      volume = v
      if (audio) audio.volume = v
    }),
    store.listenX('player.muted', v => {
      muted = v
      if (audio) audio.muted = v
    })
  )

  main.player$listen(
    clean(async msg => {
      switch (msg.type) {
        case 'SELECT':
          if (audio) audio.src = msg.src
          break
        case 'PLAY':
          logger.info('start at', msg.seconds)
          await waitForSrc(msg.src)
          if (audio) audio.time = msg.seconds
          await audio?.play()
          break
        case 'PAUSE':
          audio?.pause()
          break
        case 'JUMP':
          if (audio?.src === msg.src) audio.time = msg.seconds
          break
      }
    })
  )

  onAudioChange.push(audio => {
    if (!audio) return
    if (volume !== undefined) audio.volume = volume
    if (muted) audio.muted = true

    const cleanups: λ[] = []
    const listen = <T extends keyof AudioEvent>(
      k: T,
      f: λ<[AudioEvent[T]]>
    ) => {
      audio.addEventListener(k, f)
      cleanups.push(() => audio.removeEventListener(k, f as any))
    }

    listen('state', ({ detail: state }) => {
      if (state === 'playing') main.player$isPlaying(audio.time, Date.now())
    })

    listen('durationchange', () => {
      main.player$setDuration(audio.duration, audio.src!)
    })

    const cleanup = () => {
      callAll(cleanups)
      remove(onAudioChange, cleanup)
    }
    onAudioChange.push(cleanup)
  })

  return {
    set audio(v: Audio | null) {
      callAll([...onAudioChange], (audio = v))
    },
    get audio() {
      return audio
    },
    cleanup: () => callAll(onCleanup),
  }
}
