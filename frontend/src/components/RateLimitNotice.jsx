import { Clock3, X } from 'lucide-react'

function RateLimitNotice({ message, retryAfter, onDismiss }) {
  return (
    <div className="glass-panel mx-auto flex w-full items-start gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-amber-100 text-amber-700">
        <Clock3 size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-[-0.02em] text-ink-900 sm:text-sm">Rate limit reached</p>
        <p className="mt-1 text-xs leading-5 text-ink-700 sm:text-sm">
          {message || 'Too many requests were sent. Please wait a moment and try again.'}
        </p>
        {retryAfter ? (
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-700 sm:text-xs">
            Try again in about {retryAfter}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="btn btn-ghost btn-xs rounded-lg text-ink-500 hover:bg-slate-100 hover:text-ink-900"
        aria-label="Dismiss rate limit notice"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default RateLimitNotice
