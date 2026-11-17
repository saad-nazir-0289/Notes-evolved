import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_NOTE_SORT_VALUE,
  NOTE_SORT_OPTIONS,
  parseNoteSortValue,
} from './noteSort.js'

test('defaults to newest-first sorting', () => {
  assert.equal(DEFAULT_NOTE_SORT_VALUE, 'createdAt:desc')
  assert.deepEqual(parseNoteSortValue(DEFAULT_NOTE_SORT_VALUE), {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
})

test('maps every visible sort choice to its API parameters', () => {
  for (const { value } of NOTE_SORT_OPTIONS) {
    const [sortBy, sortOrder] = value.split(':')
    assert.deepEqual(parseNoteSortValue(value), { sortBy, sortOrder })
  }
})

test('falls back safely for unknown or malformed option values', () => {
  for (const value of [undefined, null, '', 'title:sideways', '__proto__:asc']) {
    assert.deepEqual(parseNoteSortValue(value), {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }
})
