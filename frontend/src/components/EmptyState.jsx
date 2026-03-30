import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

function EmptyState() {
  return (
    <MotionDiv
      className="glass-panel mx-auto flex max-w-xl flex-col items-center px-4 py-8 text-center sm:px-7 sm:py-10"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="rounded-full bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 sm:text-sm">
        Nothing here yet
      </div>
      <h2 className="mt-3 text-[1.3rem] font-extrabold tracking-[-0.04em] text-ink-900 sm:text-[1.6rem]">
        Start your first note
      </h2>
      <p className="mt-2 max-w-md text-xs leading-6 text-ink-700 sm:text-sm sm:leading-7">
        Create a note for ideas, reminders, shopping lists, or anything you want to keep nearby.
      </p>
      <MotionDiv whileTap={{ scale: 0.98 }}>
        <Link to="/create" className="primary-btn mt-5 rounded-[14px] px-5 font-semibold">
          Create New Note
        </Link>
      </MotionDiv>
    </MotionDiv>
  )
}

export default EmptyState
