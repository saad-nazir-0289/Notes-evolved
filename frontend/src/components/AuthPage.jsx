import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { NotebookText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { status, login, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'loading') {
    return <main className="app-shell grid min-h-screen place-items-center p-4" role="status">Restoring your session...</main>
  }
  if (status === 'authenticated') return <Navigate to="/" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await (isRegister ? register : login)({ email: email.trim(), password })
      const from = location.state?.from
      const requestedPath = typeof from?.pathname === 'string' ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/'
      const destination = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to authenticate. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="glass-panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white">
            <NotebookText size={20} />
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-ink-900">Notes<span className="font-medium text-ink-700">App</span></p>
            <p className="text-xs text-ink-500">Your thoughts, in one place</p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-ink-700">
          {isRegister ? 'Start building your personal notes space.' : 'Sign in to continue to your notes.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="field-input"
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="field-input"
              type="password"
              name="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 12 : 1}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {isRegister && <p className="mt-1.5 text-xs text-ink-500">Use at least 12 characters.</p>}
          </div>

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

          <button className="primary-btn w-full justify-center" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link className="font-semibold text-brand-700 hover:underline" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
