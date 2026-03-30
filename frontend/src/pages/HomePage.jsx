import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import Navbar from '../components/Navbar'
import NoteCard from '../components/NoteCard'
import { useNotes } from '../context/useNotes'
import { useRateLimit } from '../context/useRateLimit'

const MotionMain = motion.main
const MotionDiv = motion.div

function HomePage() {
  const { notes, loading, fetchError, deleteNote } = useNotes()
  const { clearRateLimit, handleRateLimitError } = useRateLimit()

  const handleDelete = async (id) => {
    try {
      clearRateLimit()
      await deleteNote(id)
      toast.success('Note deleted successfully')
    } catch (error) {
      if (handleRateLimitError(error)) return
      toast.error('Unable to delete note')
    }
  }

  return (
    <>
      <Navbar />

      <MotionMain
        className="page-wrap py-4 sm:py-6 lg:py-7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-panel overflow-hidden p-4 sm:p-4.5">
                <div className="loading-shimmer h-5 w-2/3 rounded-md" />
                <div className="mt-3 h-px bg-slate-200" />
                <div className="mt-3 space-y-2">
                  <div className="loading-shimmer h-3.5 w-full rounded-md" />
                  <div className="loading-shimmer h-3.5 w-5/6 rounded-md" />
                  <div className="loading-shimmer h-3.5 w-3/4 rounded-md" />
                </div>
                <div className="mt-4 h-px bg-slate-200" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="loading-shimmer h-3 w-24 rounded-md" />
                  <div className="flex gap-2">
                    <div className="loading-shimmer h-6 w-6 rounded-lg" />
                    <div className="loading-shimmer h-6 w-6 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : fetchError === 'rate-limit' ? (
          <MotionDiv
            className="glass-panel mx-auto max-w-md p-4 text-center text-sm text-ink-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Notes are temporarily unavailable because too many requests were sent.
          </MotionDiv>
        ) : fetchError === 'general' ? (
          <MotionDiv
            className="glass-panel mx-auto max-w-md p-4 text-center text-sm text-ink-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Unable to load notes right now.
          </MotionDiv>
        ) : notes.length ? (
          <MotionDiv layout className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </MotionDiv>
        ) : (
          <EmptyState />
        )}
      </MotionMain>
    </>
  )
}

export default HomePage
