import 'jest-extended'
import Store from './storeX'

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
}

test('calls getters', () => {
  const store = new Store<StoreSchema>()

  const getApp = jest.fn(() => ({ colorTheme: 'dark', useSystemTheme: false }))
  const getTheme = jest.fn(() => 'light')

  store.handler('settings.appearance').get(getApp as any)
  expect(store.get('settings.appearance.colorTheme')).toBe('dark')
  expect(getApp).toHaveBeenCalled()
  expect(getTheme).not.toHaveBeenCalled()

  store.handler('settings.appearance.colorTheme').get(getTheme as any)
  expect(store.get('settings.appearance.colorTheme')).toBe('light')
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
  expect(thSet).toHaveBeenLastCalledWith('light', 'settings.appearance')

  store.set('settings.appearance.colorTheme', 'dark')
  expect(thSet).toHaveBeenCalledTimes(2)
  expect(thSet).toHaveBeenLastCalledWith(
    'dark',
    'settings.appearance.colorTheme'
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
  expect(optSet).toHaveBeenLastCalledWith(0, 'settings.appearance')
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
  expect(optSet).toHaveBeenLastCalledWith(1, 'settings.appearance.opt')
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
