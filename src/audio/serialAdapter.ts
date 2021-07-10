import type Audio from 'components/webcomponents/audio.comp'
import { main } from 'workers'
import store from 'store/uiThread/api'
import { proxy, release } from 'fiber'
import { callAll } from 'utils/function'
import { remove } from 'utils/array'
import type { PlayState } from './state'

export default () => {
  let audio: Audio | null = null
  const onAudioChange: λ<[Audio | null]>[] = []

  const onCleanup: (λ | undefined)[] = []
  const clean = <T extends λ>(f: T): T => {
    const wrapped = proxy(f)
    onCleanup.push(wrapped[release])
    return wrapped
  }

  const srcCache: Record<string, Promise<string>> = {}

  const src = async (id: EpisodeId) =>
    await (srcCache[id[1]] ??= store.getX('episodes.*.*.file', ...id))

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

  main.player$listen(
    clean(async msg => {
      switch (msg.type) {
        case 'SELECT':
          if (audio) audio.src = await src(msg.id)
          break
        case 'PLAY':
          await waitForSrc(await src(msg.id))
          await audio?.play()
          break
        case 'PAUSE':
          audio?.pause()
      }
    })
  )

  onAudioChange.push(audio => {
    if (!audio) return

    const onStateChange = ({ detail: state }: CustomEvent<PlayState>) => {
      if (state === 'playing')
        main.player$post({ type: 'IS_PLAYING', seconds: audio.time })
    }

    audio.addEventListener('state', onStateChange)
    const cleanup = () => {
      audio.removeEventListener('state', onStateChange as any)
      remove(onAudioChange, cleanup)
    }
    onAudioChange.push(cleanup)
  })

  return {
    set audio(v: Audio | null) {
      callAll([...onAudioChange], (audio = v))
    },
    cleanup: () => callAll(onCleanup),
  }
}
