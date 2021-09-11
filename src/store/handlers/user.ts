import type * as GQL from 'types/gql'
import idb from 'main/idb/idb'
import { State } from 'store/state'
import MemCache, { OptPrim, _, HookDict, FBDict } from 'store/utils/memCache'
import { idbDefaultReader, idbWriter } from 'store/utils/idb'
import * as api from 'api/calls'
import * as convert from 'api/convert'
import epStore from 'main/episodeStore'
import { omitNullish } from 'utils/object'

export default class UserState extends MemCache<State['user']> {
  root = 'user'
  state: OptPrim<State['user']> = _
  sync = 'user'

  hooks: HookDict<State['user']> = {
    $: async state => {
      await (state ? this.writeSignedIn(state) : this.writeSignedOut())
      queueMicrotask(() => this.reattach())
    },
    subscriptions: idbWriter('subscriptions'),
    wpSubs: idbWriter('wpSubs'),
    wsAuth: idbWriter('wsAuth'),
  }

  fbs: FBDict<State['user']> = {
    subscriptions: () => [],
    wpSubs: () => [],
    wsAuth: () => undefined,
  }

  async init() {
    const state = await idbDefaultReader([
      'currentUser',
      'subscriptions',
      'wpSubs',
      'wsAuth',
    ])

    if (!state.currentUser) this.state = null
    else {
      this.state = {
        id: state.currentUser,
        subscriptions: state.subscriptions ?? [],
        wpSubs: state.wpSubs ?? [],
        wsAuth: state.wsAuth,
      }
      this.reattach()
    }

    this.pullRemote()
  }

  public async signIn(data: GQL.MeInitial) {
    logger.info('signin', data)
    await this.initialized
    logger.info('initialized')
    if (this.state) throw Error('already signed in')

    await Promise.all(
      data.subscriptions.added.map(v => this.storePodcast(v, true, true))
    )
    logger.info('podcasts stored')

    this.store.set('user', {
      id: data.id,
      subscriptions: data.subscriptions.added.map(({ id }) => id),
      wpSubs: [],
      ...omitNullish({ wsAuth: data.wsAuth }),
    })
  }

  public signOut() {
    this.store.set('user.subscriptions', [])
    this.store.set('user.wpSubs', [])
    this.store.set('user', null)
  }

  private async writeSignedIn(user: Exclude<State['user'], null>) {
    const db = await idb
    await db.put('meta', user.id, 'currentUser')
    await db.put('meta', user.subscriptions, 'subscriptions')
    await db.put('meta', user.wpSubs, 'wpSubs')
    await db.put('meta', user.wsAuth, 'wsAuth')
  }

  private async writeSignedOut() {
    const db = await idb
    await Promise.all([
      db.delete('meta', 'currentUser'),
      db.delete('meta', 'subscriptions'),
      db.delete('meta', 'wpSubs'),
      db.delete('meta', 'wsAuth'),
      db.clear('podcasts'),
      db.clear('episodes'),
    ])
  }

  private async pullRemote() {
    const state = await this.initialized
    if (!state) return

    const remote = await api.query.me(state.subscriptions)
    await this.storePodcastsDiff(remote?.subscriptions)

    logger.info({ remote })

    if (!remote && this.state) this.signOut()
  }

  public async storePodcastsDiff({
    added = [],
    removed = [],
  }: Partial<GQL.Me_me_subscriptions> = {}): Promise<
    { added: string[]; removed: string[] } | undefined
  > {
    const state = await this.initialized
    if (!state) return

    let subs = [...state.subscriptions]

    subs = subs.filter(id => !removed.includes(id))

    for (const pod of added) {
      await this.storePodcast(pod)
      subs.push(pod.id)
    }

    const diff = {
      added: subs.filter(id => !state.subscriptions.includes(id)),
      removed: state.subscriptions.filter(id => !subs.includes(id)),
    }

    if (diff.added.length + diff.removed.length)
      this.store.set('user.subscriptions', subs)

    return diff
  }

  private async storePodcast(
    podcast: GQL.Me_me_subscriptions_added,
    subscribed?: true,
    seeding?: boolean
  ) {
    logger.info(
      `[user] store podcast ${podcast.id} with ${podcast.episodes?.edges.length} episodes`
    )
    const data = convert.podcast(podcast)
    if (seeding && data) data.seeding = true
    this.store.set('podcasts.*', data, { subscribed }, podcast.id)
    if (!podcast.episodes?.edges.length) return
    const store = await (await epStore).getPodcast(podcast.id, subscribed)
    store.addEpisodes(
      podcast.episodes.edges.map(v => convert.episode(v.node, podcast.id))
    )
  }
}
