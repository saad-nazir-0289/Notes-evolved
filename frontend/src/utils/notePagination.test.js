import test from 'node:test'
import assert from 'node:assert/strict'
import { NOTE_PAGE_SIZE, normalizeNotePagination } from './notePagination.js'

const createNotes = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1 }))

test('normalizes server pagination metadata for the first page', () => {
  const notes = createNotes(12)
  const result = normalizeNotePagination({ page: 1, limit: 12, total: 25, totalPages: 3 }, notes)

  assert.equal(result.page, 1)
  assert.equal(result.pageSize, NOTE_PAGE_SIZE)
  assert.equal(result.total, 25)
  assert.equal(result.totalPages, 3)
  assert.equal(result.startIndex, 1)
  assert.equal(result.endIndex, 12)
  assert.equal(result.hasPreviousPage, false)
  assert.equal(result.hasNextPage, true)
})

test('calculates correct ranges for a partial final page', () => {
  const result = normalizeNotePagination({ page: 3, limit: 12, total: 25 }, createNotes(1))
  assert.equal(result.startIndex, 25)
  assert.equal(result.endIndex, 25)
  assert.equal(result.hasPreviousPage, true)
  assert.equal(result.hasNextPage, false)
})

test('clamps stale page metadata when the collection shrinks', () => {
  const result = normalizeNotePagination({ page: 9, limit: 12, total: 13 }, createNotes(1))
  assert.equal(result.page, 2)
  assert.equal(result.totalPages, 2)
  assert.equal(result.startIndex, 13)
})

test('handles empty results and invalid metadata safely', () => {
  const result = normalizeNotePagination({ page: -1, limit: 500, total: -4 }, [])
  assert.equal(result.page, 1)
  assert.equal(result.pageSize, NOTE_PAGE_SIZE)
  assert.equal(result.total, 0)
  assert.equal(result.totalPages, 0)
  assert.equal(result.startIndex, 0)
  assert.equal(result.endIndex, 0)
  assert.equal(result.hasNextPage, false)
})

test('falls back to a single page for legacy array-only responses', () => {
  const notes = createNotes(3)
  const result = normalizeNotePagination(null, notes)
  assert.equal(result.total, 3)
  assert.equal(result.page, 1)
  assert.equal(result.endIndex, 3)
  assert.equal(result.totalPages, 1)
})
