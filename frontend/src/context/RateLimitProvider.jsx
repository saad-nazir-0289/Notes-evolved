import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { RateLimitContext } from './rateLimitContext'
import { getRateLimitDetails, isRateLimitError } from '../utils/rateLimit'

export function RateLimitProvider({ children }) {
  const clearRateLimit = useCallback(() => {
    return undefined
  }, [])

  const showRateLimit = useCallback((input = {}) => {
    const details = isRateLimitError(input) ? getRateLimitDetails(input) : input
    toast.error(details.message || 'Too many requests were sent. Please wait a moment and try again.')
  }, [])

  const handleRateLimitError = useCallback(
    (error, fallbackMessage) => {
      if (!isRateLimitError(error)) {
        return false
      }

      const details = getRateLimitDetails(error, fallbackMessage)
      showRateLimit(details)
      return true
    },
    [showRateLimit],
  )

  const value = useMemo(
    () => ({
      clearRateLimit,
      showRateLimit,
      handleRateLimitError,
    }),
    [clearRateLimit, showRateLimit, handleRateLimitError],
  )

  return <RateLimitContext.Provider value={value}>{children}</RateLimitContext.Provider>
}
