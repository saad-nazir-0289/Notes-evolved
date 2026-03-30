import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

const MotionDiv = motion.div

function AppLayout() {
  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <MotionDiv
          className="absolute left-[-8rem] top-[-6rem] h-60 w-60 rounded-full bg-amber-200/50 blur-3xl sm:h-72 sm:w-72"
          animate={{ x: [0, 18, 0], y: [0, 14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute right-[-7rem] top-16 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl sm:h-80 sm:w-80"
          animate={{ x: [0, -16, 0], y: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute bottom-[-8rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/60 blur-3xl sm:h-96 sm:w-96"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Outlet />
    </div>
  )
}

export default AppLayout
