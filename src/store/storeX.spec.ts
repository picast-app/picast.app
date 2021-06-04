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

const store = new Store<StoreSchema>()

test('get handlers', () => {
  const getApp = jest.fn(() => ({ colorTheme: 'dark', useSystemTheme: false }))
  const getTheme = jest.fn(() => 'light')

  store.addHandler('settings.appearance', getApp as any)
  expect(store.get('settings.appearance.colorTheme')).toBe('dark')
  expect(getApp.mock.calls.length).toBe(1)
  expect(getTheme.mock.calls.length).toBe(0)

  store.addHandler('settings.appearance.colorTheme', getTheme as any)
  expect(store.get('settings.appearance.colorTheme')).toBe('light')
  expect(getApp.mock.calls.length).toBe(1)
  expect(getTheme.mock.calls.length).toBe(1)
})
