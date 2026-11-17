export const DEFAULT_NOTE_SORT_VALUE = 'createdAt:desc'

export const NOTE_SORT_OPTIONS = Object.freeze([
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
])

const allowedSortValues = new Set(NOTE_SORT_OPTIONS.map(({ value }) => value))

export const parseNoteSortValue = (value) => {
  if (typeof value !== 'string' || !allowedSortValues.has(value)) {
    return { sortBy: 'createdAt', sortOrder: 'desc' }
  }

  const [sortBy, sortOrder] = value.split(':')
  return { sortBy, sortOrder }
}
