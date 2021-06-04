import * as path from './path'

const obj = {
  a: {
    b: {
      c: { e: 'f', g: 'h' },
      i: { j: 'k', l: { m: 'n' }, o: 'p' },
      q: 'r',
      s: undefined,
    },
  },
  foo: { bar: 'baz' },
}

test('picks path', () => {
  expect(path.pick(obj, 'a', 'b', 'c', 'g')).toBe('h')
})

test('indicates non-existent', () => {
  expect(path.pick(obj, 'a', 'b', 'c', 'd', 'e', 'f', 'g')).toBe(path.none)
  expect(path.pick(obj, 'a', 'b', 's')).toBe(undefined)
  expect(path.pick(obj, 'a', 'b', 't')).toBe(path.none)
})
