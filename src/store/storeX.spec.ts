import 'jest-extended'
import Store from './storeX'

globalThis.logger = console

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
  expect(thSet).toHaveBeenLastCalledWith('light', 'settings.appearance', {})

  store.set('settings.appearance.colorTheme', 'dark')
  expect(thSet).toHaveBeenCalledTimes(2)
  expect(thSet).toHaveBeenLastCalledWith(
    'dark',
    'settings.appearance.colorTheme',
    {}
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
  expect(optSet).toHaveBeenLastCalledWith(0, 'settings.appearance', {})
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
  expect(optSet).toHaveBeenLastCalledWith(1, 'settings.appearance.opt', {})
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

  await expect(store.get('items.*', 'a')).resolves.toMatchObject(items.a)
  expect(getter).toHaveBeenLastCalledWith('items.a', 'a')
  await expect(store.get('items.*', 'b')).resolves.toMatchObject(items.b)
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
  expect(setter).toHaveBeenLastCalledWith({ title: 'foo' }, 'items.a', {}, 'a')
  expect(() => store.set('items.*.title', 'foo', {}, 'a')).not.toThrow()
  expect(setter).toHaveBeenLastCalledWith('foo', 'items.a.title', {}, 'a')
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
  expect(titleSet).toHaveBeenLastCalledWith('foo', 'items.a.title', {}, 'a')

  expect(() => store.merge('items.*', { author: 'bar' }, 'a')).not.toThrow()
  expect(titleSet).toHaveBeenCalledTimes(1)
  expect(authSet).toHaveBeenCalledTimes(1)
  expect(authSet).toHaveBeenLastCalledWith('bar', 'items.a.author', {}, 'a')
})

// todo: wildcard merge
