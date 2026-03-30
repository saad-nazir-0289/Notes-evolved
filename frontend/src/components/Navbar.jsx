import { NotebookText, SquarePen } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="border-b border-slate-200/80 bg-white/80 shadow-[0_8px_30px_rgba(148,163,184,0.08)] backdrop-blur-xl">
      <div className="page-wrap flex min-h-16 items-center justify-between gap-3 py-2.5 sm:min-h-18 sm:gap-3 sm:py-3">
        <Link to="/" className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.18)] sm:h-9 sm:w-9">
            <NotebookText size={18} strokeWidth={2.1} />
          </div>
          <div>
            <p className="text-[1.2rem] font-extrabold tracking-[-0.04em] text-ink-900 sm:text-[1.4rem] lg:text-[1.55rem]">
              Notes<span className="font-medium text-ink-700">App</span>
            </p>
          </div>
        </Link>

        {isHome ? (
          <Link to="/create" className="primary-btn rounded-[14px] px-3 font-semibold sm:px-4">
            <SquarePen size={14} />
            <span className="hidden sm:inline">Create New Note</span>
            <span className="sm:hidden">New Note</span>
          </Link>
        ) : null}
      </div>
    </header>
  )
}

export default Navbar
