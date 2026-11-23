import test from 'node:test'
import assert from 'node:assert/strict'
import { clearAccessToken, readAccessToken, saveAccessToken } from './authSession.js'

const TOKEN = 'header.payload.signature'

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('stores and reads a compact access token in the supplied storage', () => {
  const storage = createStorage()
  saveAccessToken(TOKEN, storage)
  assert.equal(readAccessToken(storage), TOKEN)
})

test('clears the access token on logout', () => {
  const storage = createStorage()
  saveAccessToken(TOKEN, storage)
  clearAccessToken(storage)
  assert.equal(readAccessToken(storage), null)
})

test('rejects and removes malformed or oversized stored tokens', () => {
  const malformed = createStorage({ 'notes-evolved.access-token': 'not-a-jwt' })
  assert.equal(readAccessToken(malformed), null)
  assert.equal(malformed.getItem('notes-evolved.access-token'), null)

  const oversized = createStorage({ 'notes-evolved.access-token': 'a'.repeat(4097) })
  assert.equal(readAccessToken(oversized), null)
  assert.equal(oversized.getItem('notes-evolved.access-token'), null)
  assert.throws(() => saveAccessToken('bad-token', createStorage()), TypeError)
})

test('handles storage access failures without leaking a token', () => {
  const unavailable = {
    getItem() { throw new Error('blocked') },
    setItem() { throw new Error('blocked') },
    removeItem() { throw new Error('blocked') },
  }
  assert.equal(readAccessToken(unavailable), null)
  assert.doesNotThrow(() => clearAccessToken(unavailable))
  assert.throws(() => saveAccessToken(TOKEN, unavailable), /Unable to save your session/)
})
