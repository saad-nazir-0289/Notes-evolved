export function isRateLimitError(error) {
  const status = error?.status || error?.response?.status || error?.cause?.status
  return status === 429
}

export function getRateLimitDetails(error, fallbackMessage) {
  const message =
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallbackMessage ||
    'Too many requests were sent. Please wait a moment and try again.'

  const retryAfterHeader =
    error?.response?.headers?.['retry-after'] ||
    error?.headers?.['retry-after'] ||
    error?.retryAfter

  return {
    message,
    retryAfter: formatRetryAfter(retryAfterHeader),
  }
}

function formatRetryAfter(value) {
  if (!value) {
    return ''
  }

  const seconds = Number(value)

  if (!Number.isNaN(seconds) && seconds > 0) {
    if (seconds < 60) {
      return `${seconds} seconds`
    }

    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  return String(value)
}
