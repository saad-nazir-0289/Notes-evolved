import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatNoteDate } from '../utils/date'

const MotionArticle = motion.article
const MotionDiv = motion.div

function NoteCard({ note, onDelete }) {
  return (
    <MotionArticle
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="glass-panel group flex h-full flex-col p-4 transition duration-300 hover:shadow-[0_18px_40px_rgba(31,41,66,0.09)] sm:p-4.5"
    >
      <Link to={`/notes/${note.id}`} className="flex-1">
        <h2 className="line-clamp-1 text-[1.1rem] font-extrabold tracking-[-0.04em] text-ink-900 sm:text-[1.25rem]">
          {note.title}
        </h2>
        <div className="my-3 h-px bg-slate-200" />
        <p className="line-clamp-3 text-xs leading-6 text-ink-700 sm:text-sm sm:leading-6">{note.description}</p>
      </Link>

      <div className="mt-4 h-px bg-slate-200" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-500 sm:text-sm">{formatNoteDate(note.createdAt)}</span>

        <div className="flex items-center gap-2">
          <MotionDiv whileTap={{ scale: 0.92 }}>
            <Link
              to={`/notes/${note.id}`}
              className="btn btn-ghost btn-xs rounded-lg text-ink-700 hover:bg-brand-50 hover:text-brand-700"
              aria-label={`Edit ${note.title}`}
            >
              <Pencil size={14} />
            </Link>
          </MotionDiv>
          <MotionDiv whileTap={{ scale: 0.92 }}>
            <button
              type="button"
              className="btn btn-ghost btn-xs rounded-lg text-ink-700 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(note.id)}
              aria-label={`Delete ${note.title}`}
            >
              <Trash2 size={14} />
            </button>
          </MotionDiv>
        </div>
      </div>
    </MotionArticle>
  )
}

export default NoteCard
