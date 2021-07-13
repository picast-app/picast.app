import 'jest-extended'
import Store from './storeX'
import queueMicrotask from 'queue-microtask'

globalThis.logger = console
globalThis.queueMicrotask = queueMicrotask

type StoreSchema = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
      opt?: number
      nestOpt?: {
        a: number
        b?: number
      }
    }
  }
  foo: string
  items: {
    '*': {
      title: string
      author?: string
    } | null
  }
  idList: string[]
  id: string
}

test('calls getters', async () => {
  const store = new Store<StoreSchema>()

  const getApp = jest.fn(() => ({ colorTheme: 'dark', useSystemTheme: false }))
  const getTheme = jest.fn(() => 'light')

  store.handler('settings.appearance').get(getApp as any)
  await expect(store.get('settings.appearance.colorTheme')).resolves.toBe(
    'dark'
  )
  expect(getApp).toHaveBeenCalled()
  expect(getTheme).not.toHaveBeenCalled()

  store.handler('settings.appearance.colorTheme').get(getTheme as any)
  await expect(store.get('settings.appearance.colorTheme')).resolves.toBe(
    'light'
  )
  expect(getApp).toHaveBeenCalledTimes(1)
  expect(getTheme).toHaveBeenCalledTimes(1)
})

test('prevents duplicate getters', () => {
  const store = new Store<StoreSchema>()
  expect(() => {
    store.handler('foo').get(() => '')
  }).not.toThrow()
  expect(() => {
    store.handler('foo').get(() => '')
  }).toThrow()
})

test('calls setters', () => {
  const store = new Store<StoreSchema>()

  const setOuter = jest.fn(() => {})
  const setInner = jest.fn(() => {})

  store.handler('settings.appearance').set(setOuter)
  store.set('settings.appearance.colorTheme', 'light')
  expect(setInner).toHaveBeenCalledTimes(0)
  expect(setOuter).toHaveBeenCalledTimes(1)

  store.handler('settings.appearance.colorTheme').set(setInner)
  store.set('settings.appearance.colorTheme', 'dark')
  expect(setInner).toHaveBeenCalledTimes(1)
  expect(setOuter).toHaveBeenCalledTimes(2)

  setOuter.mockReset()
  setInner.mockReset()
  store.set('settings.appearance.colorTheme', 'light')
  expect(setOuter).toHaveBeenCalledAfter(setInner)
})

test('diff setter', () => {
  const store = new Store<StoreSchema>()

  const listener = jest.fn(() => {})
  store.handler('settings.appearance.colorTheme').set(listener)

  let last: any = undefined
  const differ = jest.fn(v => {
    const diff = last !== v
    last = v
    return diff
  })
  store.handler('settings.appearance.colorTheme').set(differ, true)

  store.set('settings.appearance.colorTheme', 'light')
  expect(listener).toHaveBeenCalledTimes(1)
  expect(differ).toHaveBeenCalledTimes(1)

  store.set('settings.appearance.colorTheme', 'light')
  expect(listener).toHaveBeenCalledTimes(1)
  expect(differ).toHaveBeenCalledTimes(2)
})

test('propagate updates down', () => {
  const store = new Store<StoreSchema>()
  const thSet = jest.fn(() => {})

  store.handler('settings.appearance.colorTheme').set(thSet)
  expect(thSet).toHaveBeenCalledTimes(0)

  store.set('settings.appearance', {
    colorTheme: 'light',
    useSystemTheme: false,
  })
  expect(thSet).toHaveBeenCalledTimes(1)
  expect(thSet).toHaveBeenLastCalledWith(
    'light',
    'settings.appearance',
    expect.anything()
  )

  store.set('settings.appearance.colorTheme', 'dark')
  expect(thSet).toHaveBeenCalledTimes(2)
  expect(thSet).toHaveBeenLastCalledWith(
    'dark',
    'settings.appearance.colorTheme',
    expect.anything()
  )
})

test('optional property & merge', () => {
  const store = new Store<StoreSchema>()
  const optSet = jest.fn(() => {})
  const optDel = jest.fn(() => {})
  const glSet = jest.fn(() => {})

  store.handler('settings.appearance.opt').set(optSet)
  store.handler('settings.appearance.opt').delete(optDel)
  store.handler('settings').set(glSet)
  expect(optSet).toHaveBeenCalledTimes(0)
  expect(optDel).toHaveBeenCalledTimes(0)
  expect(optDel).toHaveBeenCalledTimes(0)
  expect(glSet).toHaveBeenCalledTimes(0)

  store.set('settings.appearance', {
    colorTheme: 'dark',
    useSystemTheme: true,
    opt: 0,
  })
  expect(optDel).toHaveBeenCalledTimes(0)
  expect(optSet).toHaveBeenCalledTimes(1)
  expect(optSet).toHaveBeenLastCalledWith(
    0,
    'settings.appearance',
    expect.anything()
  )
  expect(glSet).toHaveBeenCalledTimes(1)

  store.set('settings.appearance', {
    colorTheme: 'dark',
    useSystemTheme: false,
  })
  expect(optSet).toHaveBeenCalledTimes(1)
  expect(optDel).toHaveBeenCalledTimes(1)
  expect(optDel).toHaveBeenLastCalledWith('settings.appearance.opt')
  expect(glSet).toHaveBeenCalledTimes(2)

  store.merge('settings.appearance', { opt: 1, colorTheme: 'light' })
  expect(optDel).toHaveBeenCalledTimes(1)
  expect(optSet).toHaveBeenCalledTimes(2)
  expect(optSet).toHaveBeenLastCalledWith(
    1,
    'settings.appearance.opt',
    expect.anything()
  )
  expect(glSet).toHaveBeenCalledTimes(4)

  // diff merge
  const themeIgn = jest.fn(() => false)
  store.handler('settings.appearance.colorTheme').set(themeIgn, true)
  store.merge('settings.appearance', { opt: 1, colorTheme: 'light' })
  expect(glSet).toHaveBeenCalledTimes(5)

  // recursive partial
  const delNestOpt = jest.fn(() => {})
  const delNestOptA = jest.fn(() => {})
  const delNestOptB = jest.fn(() => {})
  store.handler('settings.appearance.nestOpt').delete(delNestOpt)
  store.handler('settings.appearance.nestOpt.a').delete(delNestOptA)
  store.handler('settings.appearance.nestOpt.b').delete(delNestOptB)

  store.set('settings.appearance.nestOpt', { a: 0, b: 1 })
  expect(delNestOpt).toHaveBeenCalledTimes(0)
  expect(delNestOptA).toHaveBeenCalledTimes(0)
  expect(delNestOptB).toHaveBeenCalledTimes(0)

  store.set('settings.appearance.nestOpt', { a: 1 })
  expect(delNestOpt).toHaveBeenCalledTimes(0)
  expect(delNestOptA).toHaveBeenCalledTimes(0)
  expect(delNestOptB).toHaveBeenCalledTimes(1)

  store.set('settings.appearance', {
    colorTheme: 'dark',
    useSystemTheme: false,
  })
  expect(delNestOpt).toHaveBeenCalledTimes(1)
  expect(delNestOptA).toHaveBeenCalledTimes(1)
  expect(delNestOptB).toHaveBeenCalledTimes(2)
})

test('search tips', () => {
  const tree = {
    a: {
      b: {
        c: 'd',
        e: {
          f: 'g',
        },
      },
    },
    foo: 'bar',
  }
  expect(Store['tips'](tree)).toEqual([
    ['a.b.c', 'd'],
    ['a.b.e.f', 'g'],
    ['foo', 'bar'],
  ])
})

test('wildcards', async () => {
  const store = new Store<StoreSchema>()

  const items = {
    a: { title: 'foo' },
    b: { title: 'bar' },
    c: { title: 'baz' },
  }
  const getter = jest.fn((path, key) => (items as any)[key] ?? null)
  store.handler('items.*').get(getter)

  await expect(store.get('settings', 'a')).toReject()
  await expect(store.get('items.*')).toReject()
  await expect(store.get('items.*', 'a')).resolves.not.toThrow()
  await expect(store.get('items.*', 'a', 'b')).toReject()

  await expect(store.get('items.*', 'a')).resolves.toEqual(items.a)
  expect(getter).toHaveBeenLastCalledWith('items.a', 'a')
  await expect(store.get('items.*', 'b')).resolves.toEqual(items.b)
  expect(getter).toHaveBeenLastCalledWith('items.b', 'b')
  await expect(store.get('items.*', 'd')).resolves.toBeNull()
  expect(getter).toHaveBeenLastCalledWith('items.d', 'd')

  await expect(store.get('items.*.title', 'a')).resolves.toBe(items.a.title)
  expect(getter).toHaveBeenLastCalledWith('items.a.title', 'a')
  await expect(store.get('items.*.title', 'd')).toReject()

  // set

  const setter = jest.fn(() => {})
  store.handler('items.*').set(setter)

  expect(() => store.set('items.*', { title: 'foo' })).toThrow()
  expect(() => store.set('items.*.title', 'foo')).toThrow()

  expect(() => store.set('items.*', { title: 'foo' }, {}, 'a')).not.toThrow()
  expect(setter).toHaveBeenLastCalledWith(
    { title: 'foo' },
    'items.a',
    expect.anything(),
    'a'
  )
  expect(() => store.set('items.*.title', 'foo', {}, 'a')).not.toThrow()
  expect(setter).toHaveBeenLastCalledWith(
    'foo',
    'items.a.title',
    expect.anything(),
    'a'
  )
  expect(() => store.set('items.*.title', 'foo', {}, 'a', 'b')).toThrow()
})

test('wildcard merge', () => {
  const store = new Store<StoreSchema>()
  const titleSet = jest.fn(() => {})
  const authSet = jest.fn(() => {})
  store.handler('items.*.title').set(titleSet)
  store.handler('items.*.author').set(authSet)

  expect(() => store.merge('items.*', { title: 'foo' })).toThrow()
  expect(() => store.merge('items.*', { title: 'foo' }, 'a')).not.toThrow()
  expect(() => store.merge('items.*', { title: 'foo' }, 'a', 'b')).toThrow()

  expect(authSet).toHaveBeenCalledTimes(0)
  expect(titleSet).toHaveBeenCalledTimes(1)
  expect(titleSet).toHaveBeenLastCalledWith(
    'foo',
    'items.a.title',
    expect.anything(),
    'a'
  )

  expect(() => store.merge('items.*', { author: 'bar' }, 'a')).not.toThrow()
  expect(titleSet).toHaveBeenCalledTimes(1)
  expect(authSet).toHaveBeenCalledTimes(1)
  expect(authSet).toHaveBeenLastCalledWith(
    'bar',
    'items.a.author',
    expect.anything(),
    'a'
  )
})

test('join state', async () => {
  const store = new Store<StoreSchema>()

  const items = {
    a: { title: 'foo' },
    b: { title: 'bar' },
    c: { title: 'baz' },
  }
  store.handler('items.*').get((p, k) => items[k as keyof typeof items])
  store.handler('items.*').set((v, _, __, k) => {
    ;(items as any)[k] = v
  })
  store.handler('idList').get(() => Object.keys(items))
  let id = 'a'
  store.handler('id').get(() => id)
  store.handler('id').set(v => {
    id = v
  })

  await expect(store.get('items.*', 'a')).resolves.toEqual(items.a)
  await expect(store.get('idList')).resolves.toEqual(['a', 'b', 'c'])
  await expect(store.get('id')).resolves.toBe('a')

  await expect(store.get('id').join('items.*')).resolves.toEqual(items.a)
  await expect(store.get('idList').join('items.*')).resolves.toEqual(
    Object.values(items)
  )

  // listeners

  const cbId = jest.fn(() => {})
  const cbList = jest.fn(() => {})
  store.listenJoined('id', 'items.*', cbId)
  store.listenJoined('idList', 'items.*', cbList)

  const wait = async () => await new Promise(res => setTimeout(res, 10))
  await wait()

  expect(cbId).toHaveBeenCalledTimes(1)
  expect(cbId).toHaveBeenLastCalledWith(items.a, 'items.*', {}, 'a')

  expect(cbList).toHaveBeenCalledTimes(1)
  expect(cbList).toHaveBeenLastCalledWith(
    Object.values(items),
    'items.*',
    {},
    ...Object.keys(items)
  )

  store.set('id', 'b')
  await wait()

  expect(cbList).toHaveBeenCalledTimes(1)
  expect(cbId).toHaveBeenCalledTimes(2)
  expect(cbId).toHaveBeenLastCalledWith(items.b, 'items.*', {}, 'b')

  store.set('items.*', { title: 'test' }, {}, 'a')
  expect(items.a).toEqual({ title: 'test' })
  await wait()
  expect(cbId).toHaveBeenCalledTimes(2)
  expect(cbList).toHaveBeenCalledTimes(2)
  expect(cbList).toHaveBeenLastCalledWith(
    Object.values(items),
    'items.*',
    {},
    ...Object.keys(items)
  )

  store.set('items.*', { title: 'test2' }, {}, 'b')
  expect(items.b).toEqual({ title: 'test2' })

  await wait()
  expect(cbId).toHaveBeenCalledTimes(3)
  expect(cbId).toHaveBeenLastCalledWith({ title: 'test2' }, 'items.*', {}, 'b')
  expect(cbList).toHaveBeenCalledTimes(3)
  expect(cbList).toHaveBeenLastCalledWith(
    Object.values(items),
    'items.*',
    {},
    ...Object.keys(items)
  )
})

// todo register wildcard listener for specific value

test.only('handler substitutions', () => {
  const store = new Store<StoreSchema>()
  const setRoot = jest.fn(() => {})
  const setA = jest.fn(() => {})
  const setRootTitle = jest.fn(() => {})
  const setATitle = jest.fn(() => {})

  store.handler('items.*').set(setRoot)
  store.handler('items.*', 'a').set(setA)
  store.handler('items.*.title').set(setRootTitle)
  store.handler('items.*.title', 'a').set(setATitle)

  store.set('items.*', { title: 'foo' }, {}, 'a')
  expect(setRoot).toHaveBeenCalledTimes(1)
  expect(setRootTitle).toHaveBeenCalledTimes(1)
  expect(setA).toHaveBeenCalledTimes(1)
  expect(setATitle).toHaveBeenCalledTimes(1)

  store.set('items.*', { title: 'bar' }, {}, 'b')
  expect(setRoot).toHaveBeenCalledTimes(2)
  expect(setRootTitle).toHaveBeenCalledTimes(2)
  expect(setA).toHaveBeenCalledTimes(1)
  expect(setATitle).toHaveBeenCalledTimes(1)

  store.set('items.*.title', 'baz', {}, 'a')
  expect(setRoot).toHaveBeenCalledTimes(3)
  expect(setRootTitle).toHaveBeenCalledTimes(3)
  expect(setA).toHaveBeenCalledTimes(2)
  expect(setATitle).toHaveBeenCalledTimes(2)

  store.set('items.*.title', 'baz', {}, 'b')
  expect(setRoot).toHaveBeenCalledTimes(4)
  expect(setRootTitle).toHaveBeenCalledTimes(4)
  expect(setA).toHaveBeenCalledTimes(2)
  expect(setATitle).toHaveBeenCalledTimes(2)
})
