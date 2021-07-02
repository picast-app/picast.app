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

const base = () => ({ a: { b: 'c', d: 'e' } })

test('set path', () => {
  const v = base()
  expect(path.set(v, 'x', 'a', 'b')).toMatchObject({ a: { b: 'x', d: 'e' } })
  expect(v).toMatchObject(base())

  expect(path.set(v, 'foo')).toBe('foo')
  expect(v).toMatchObject(base())
})

test('mutate path', () => {
  const v = base()
  expect(path.mutate(v, 'x', 'a', 'b')).toBe('c')
  expect(v).toMatchObject({ a: { b: 'x', d: 'e' } })
})

test('paths', () => {
  expect(path.paths(null)).toEqual([])
  expect(path.paths('')).toEqual([])
  expect(path.paths([1, 2, 3])).toEqual([])
  expect(path.paths({})).toEqual([])
  expect(path.paths({ foo: 'bar' })).toEqual([['foo']])
  expect(path.paths({ a: { b: 'c', d: { e: 'f' } }, g: 0 })).toEqual([
    ['a'],
    ['a', 'b'],
    ['a', 'd'],
    ['a', 'd', 'e'],
    ['g'],
  ])
})
