import 'jest-extended'
import Store from './storeX'

type StoreSchema = {
  settings: {
    appearance: {
      colorTheme: 'light' | 'dark'
      useSystemTheme: boolean
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

  store.handler('settings.appearance').set = setOuter
  store.set('settings.appearance.colorTheme', 'light')
  expect(setInner).toHaveBeenCalledTimes(0)
  expect(setOuter).toHaveBeenCalledTimes(1)

  store.handler('settings.appearance.colorTheme').set = setInner
  store.set('settings.appearance.colorTheme', 'dark')
  expect(setInner).toHaveBeenCalledTimes(1)
  expect(setOuter).toHaveBeenCalledTimes(2)

  setOuter.mockReset()
  setInner.mockReset()
  store.set('settings.appearance.colorTheme', 'light')
  expect(setOuter).toHaveBeenCalledAfter(setInner)
})
