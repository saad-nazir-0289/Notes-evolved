const ACCESS_TOKEN_KEY = 'notes-evolved.access-token'
const COMPACT_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

const resolveStorage = (storage) => storage ?? globalThis.sessionStorage

export const readAccessToken = (storage) => {
  try {
    const target = resolveStorage(storage)
    const token = target?.getItem(ACCESS_TOKEN_KEY)

    if (typeof token !== 'string' || token.length > 4096 || !COMPACT_TOKEN_PATTERN.test(token)) {
      if (token !== null && token !== undefined) target?.removeItem(ACCESS_TOKEN_KEY)
      return null
    }

    return token
  } catch {
    return null
  }
}

export const saveAccessToken = (token, storage) => {
  if (typeof token !== 'string' || token.length > 4096 || !COMPACT_TOKEN_PATTERN.test(token)) {
    throw new TypeError('A valid access token is required')
  }

  try {
    const target = resolveStorage(storage)
    if (!target?.setItem) throw new Error('Session storage is unavailable')
    target.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    throw new Error('Unable to save your session in this browser. Enable session storage and try again.')
  }
}

export const clearAccessToken = (storage) => {
  try {
    resolveStorage(storage)?.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // Clearing an unavailable storage area must not prevent the UI from logging out.
  }
}
