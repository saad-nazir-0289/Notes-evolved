import { useContext } from 'react'
import { RateLimitContext } from './rateLimitContext'

export function useRateLimit() {
  const context = useContext(RateLimitContext)

  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider')
  }

  return context
}
