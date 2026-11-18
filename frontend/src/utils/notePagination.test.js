import test from 'node:test'
import assert from 'node:assert/strict'
import { NOTE_PAGE_SIZE, paginateNotes } from './notePagination.js'

const createNotes = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1 }))

test('uses a bounded default page size and returns the first page', () => {
  const notes = createNotes(25)
  const result = paginateNotes(notes)

  assert.equal(NOTE_PAGE_SIZE, 12)
  assert.deepEqual(result.items, notes.slice(0, 12))
  assert.equal(result.page, 1)
  assert.equal(result.totalPages, 3)
  assert.equal(result.startIndex, 0)
  assert.equal(result.endIndex, 12)
  assert.equal(result.hasPreviousPage, false)
  assert.equal(result.hasNextPage, true)
})

test('returns only the remaining notes on the final page', () => {
  const notes = createNotes(25)
  const result = paginateNotes(notes, 3)

  assert.deepEqual(result.items, notes.slice(24))
  assert.equal(result.page, 3)
  assert.equal(result.startIndex, 24)
  assert.equal(result.endIndex, 25)
  assert.equal(result.hasPreviousPage, true)
  assert.equal(result.hasNextPage, false)
})

test('clamps an out-of-range page after a collection shrinks', () => {
  const notes = createNotes(13)
  const result = paginateNotes(notes, 3)

  assert.equal(result.page, 2)
  assert.deepEqual(result.items, notes.slice(12))
  assert.equal(result.hasNextPage, false)
})

test('handles empty collections without exposing an invalid page', () => {
  const result = paginateNotes([], 8)

  assert.deepEqual(result.items, [])
  assert.equal(result.page, 1)
  assert.equal(result.totalPages, 0)
  assert.equal(result.startIndex, 0)
  assert.equal(result.endIndex, 0)
  assert.equal(result.hasPreviousPage, false)
  assert.equal(result.hasNextPage, false)
})

test('falls back safely for invalid page and page-size values', () => {
  const notes = createNotes(14)
  const result = paginateNotes(notes, Number.POSITIVE_INFINITY, 0)

  assert.equal(result.page, 1)
  assert.equal(result.pageSize, NOTE_PAGE_SIZE)
  assert.deepEqual(result.items, notes.slice(0, NOTE_PAGE_SIZE))
})
