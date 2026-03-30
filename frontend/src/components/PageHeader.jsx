import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

function PageHeader({ title, description, showBack = false }) {
  return (
    <MotionDiv
      className="page-wrap py-5 sm:py-7 lg:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {showBack ? (
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 sm:mb-6 sm:text-base"
        >
          <ArrowLeft size={18} />
          <span>Back to Notes</span>
        </Link>
      ) : null}

      <div className="text-center">
        <h1 className="text-[1rem] font-extrabold tracking-[-0.05em] text-ink-900 sm:text-[1.5rem] lg:text-[1.8rem]">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-2 max-w-lg text-xs text-ink-700 sm:text-sm">{description}</p>
        ) : null}
      </div>
    </MotionDiv>
  )
}

export default PageHeader
