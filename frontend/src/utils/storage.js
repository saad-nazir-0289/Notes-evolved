export const STORAGE_KEY = 'notes-app-items'

export function getStoredNotes(fallback) {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return fallback
  }

  try {
    return JSON.parse(stored)
  } catch {
    return fallback
  }
}
