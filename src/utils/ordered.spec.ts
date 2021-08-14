import { OrderedList, OrderedMap } from './ordered'

test('Ordered List', () => {
  const asc = new OrderedList<number>()
  const desc = new OrderedList<number>((a, b) => b - a)

  for (const n of [2, 1, 3, 2]) {
    asc.add(n)
    desc.add(n)
  }
  expect(asc.values).toEqual([1, 2, 2, 3])
  expect(desc.values).toEqual([3, 2, 2, 1])

  asc.add(5, 4, 5, 6)
  desc.add(5, 4, 5, 6)
  expect(asc.values).toEqual([1, 2, 2, 3, 4, 5, 5, 6])
  expect(desc.values).toEqual([6, 5, 5, 4, 3, 2, 2, 1])

  const elAsc: number[] = []
  for (const el of asc) elAsc.push(el)
  const elDesc: number[] = []
  for (const el of desc) elDesc.push(el)
  expect(elAsc).toEqual([1, 2, 2, 3, 4, 5, 5, 6])
  expect(elDesc).toEqual([6, 5, 5, 4, 3, 2, 2, 1])

  expect(asc.map(n => String.fromCharCode(96 + n))).toEqual(
    'abbcdeef'.split('')
  )

  const lt4 = asc.filter(n => n < 4)
  expect(lt4.size).toBe(4)
  expect(lt4.values).toEqual([1, 2, 2, 3])

  asc.clear()
  desc.clear()
  expect(asc.values).toEqual([])
  expect(desc.values).toEqual([])

  const random = [...Array(1000)].map(() => Math.random())
  const sorted = new OrderedList<number>()
  sorted.add(...random)
  expect(sorted.values).toEqual([...random].sort())
})

test('Ordered Map', () => {
  const map = new OrderedMap<string, string>()

  map.set('c', 'C')
  map.set('a', 'A')
  map.set('b', 'B')

  expect([...map.entries()]).toEqual([
    ['a', 'A'],
    ['b', 'B'],
    ['c', 'C'],
  ])
  expect([...map]).toEqual([...map.entries()])

  expect([...map.keys()]).toEqual(['a', 'b', 'c'])

  expect([...map.values()]).toEqual(['A', 'B', 'C'])
})
