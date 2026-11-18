export const NOTE_PAGE_SIZE = 12

export const paginateNotes = (notes, page = 1, pageSize = NOTE_PAGE_SIZE) => {
  const collection = Array.isArray(notes) ? notes : []
  const normalizedPageSize = Number.isSafeInteger(pageSize) && pageSize > 0
    ? pageSize
    : NOTE_PAGE_SIZE
  const total = collection.length
  const totalPages = Math.ceil(total / normalizedPageSize)
  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1
  const normalizedPage = Math.min(requestedPage, Math.max(totalPages, 1))
  const startIndex = (normalizedPage - 1) * normalizedPageSize
  const endIndex = Math.min(startIndex + normalizedPageSize, total)

  return {
    items: collection.slice(startIndex, endIndex),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total,
    totalPages,
    startIndex,
    endIndex,
    hasPreviousPage: normalizedPage > 1,
    hasNextPage: normalizedPage < totalPages,
  }
}
