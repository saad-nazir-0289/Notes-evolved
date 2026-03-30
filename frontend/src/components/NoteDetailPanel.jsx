import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2, X } from 'lucide-react'
import { formatNoteDate } from '../utils/date'
import NoteForm from './NoteForm'

const MotionDiv = motion.div
const MotionButton = motion.button

function NoteDetailPanel({
  note,
  isEditing,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onEditToggle,
  onCancelEdit,
  onSave,
  onDelete,
  isSubmitting,
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isEditing ? (
        <MotionDiv
          key="edit"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <NoteForm
            title={title}
            description={description}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
            onSubmit={onSave}
            submitLabel={isSubmitting ? 'Saving...' : 'Save Changes'}
            isSubmitting={isSubmitting}
            secondaryAction={
              <MotionButton
                type="button"
                whileTap={{ scale: 0.98 }}
                className="secondary-btn w-full rounded-[14px] px-5 font-semibold sm:w-auto sm:min-w-32"
                onClick={onCancelEdit}
              >
                <X size={14} />
                Cancel
              </MotionButton>
            }
          />
        </MotionDiv>
      ) : (
        <MotionDiv
          key="detail"
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glass-panel mx-auto w-full max-w-3xl p-4 sm:p-5 lg:p-6"
        >
          <h2 className="text-[1.4rem] font-extrabold tracking-[-0.05em] text-ink-900 sm:text-[1.7rem]">{note.title}</h2>
          <p className="mt-2 text-sm text-ink-500 sm:text-base">Created: {formatNoteDate(note.createdAt)}</p>
          <div className="my-4 h-px bg-slate-200" />
          <p className="text-sm leading-7 text-ink-700 sm:text-base sm:leading-8">{note.description}</p>
          <div className="my-4 h-px bg-slate-200" />

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <MotionButton
              type="button"
              whileTap={{ scale: 0.98 }}
              className="primary-btn w-full rounded-[14px] px-5 font-semibold sm:w-auto sm:min-w-32"
              onClick={onEditToggle}
            >
              <Pencil size={14} />
              Edit
            </MotionButton>
            <MotionButton
              type="button"
              whileTap={{ scale: 0.98 }}
              className="danger-btn w-full rounded-[14px] px-5 font-semibold sm:w-auto sm:min-w-32"
              onClick={onDelete}
            >
              <Trash2 size={14} />
              Delete
            </MotionButton>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default NoteDetailPanel
