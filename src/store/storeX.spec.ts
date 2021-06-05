import 'jest-extended'
import Store from './storeX'

type StoreSchema = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
      opt?: number
    }
  }
  foo: string
}

test('calls getters', () => {
  const store = new Store<StoreSchema>()

  const getApp = jest.fn(() => ({ colorTheme: 'dark', useSystemTheme: false }))
  const getTheme = jest.fn(() => 'light')

  store.handler('settings.appearance').get = getApp as any
  expect(store.get('settings.appearance.colorTheme')).toBe('dark')
  expect(getApp).toHaveBeenCalled()
  expect(getTheme).not.toHaveBeenCalled()

  store.handler('settings.appearance.colorTheme').get = getTheme as any
  expect(store.get('settings.appearance.colorTheme')).toBe('light')
  expect(getApp).toHaveBeenCalledTimes(1)
  expect(getTheme).toHaveBeenCalledTimes(1)
})

test('prevents duplicate getters', () => {
  const store = new Store<StoreSchema>()
  expect(() => {
    store.handler('foo').get = () => ''
  }).not.toThrow()
  expect(() => {
    store.handler('foo').get = () => ''
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

test('drill down attrs', () => {
  const store = new Store<StoreSchema>()
  const thGet = jest.fn(() => {})

  store.handler('settings.appearance.colorTheme').set(thGet)
  expect(thGet).toHaveBeenCalledTimes(0)

  store.set('settings.appearance', {
    colorTheme: 'light',
    useSystemTheme: false,
  })
  expect(thGet).toHaveBeenCalledTimes(1)
  expect(thGet).toHaveBeenCalledWith('light', 'settings.appearance')

  store.set('settings.appearance.colorTheme', 'dark')
  expect(thGet).toHaveBeenCalledTimes(2)
  expect(thGet).toHaveBeenCalledWith('dark', 'settings.appearance.colorTheme')
})
