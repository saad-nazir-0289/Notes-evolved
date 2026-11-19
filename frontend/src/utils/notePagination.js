export const NOTE_PAGE_SIZE = 12
export const NOTE_MAX_PAGE_SIZE = 50

const isPositiveSafeInteger = (value) => Number.isSafeInteger(value) && value > 0

export const normalizeNotePagination = (meta, notes = []) => {
  const pageSize = isPositiveSafeInteger(meta?.limit) && meta.limit <= NOTE_MAX_PAGE_SIZE
    ? meta.limit
    : NOTE_PAGE_SIZE
  const total = Number.isSafeInteger(meta?.total) && meta.total >= 0
    ? meta.total
    : notes.length
  const totalPages = Math.ceil(total / pageSize)
  const requestedPage = isPositiveSafeInteger(meta?.page) ? meta.page : 1
  const page = Math.min(requestedPage, Math.max(totalPages, 1))
  const startIndex = total === 0 || notes.length === 0 ? 0 : ((page - 1) * pageSize) + 1
  const endIndex = startIndex === 0
    ? 0
    : Math.min(startIndex + Math.min(notes.length, pageSize) - 1, total)

  return {
    page,
    pageSize,
    total,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  }
}
