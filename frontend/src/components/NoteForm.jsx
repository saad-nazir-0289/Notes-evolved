import { motion } from 'framer-motion'

const MotionForm = motion.form
const MotionButton = motion.button

function NoteForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  submitLabel,
  secondaryAction,
  isSubmitting,
}) {
  return (
    <MotionForm
      className="glass-panel mx-auto w-full max-w-2xl p-4 sm:p-5 lg:p-6 will-change-transform"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="space-y-4 sm:space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink-900 sm:text-base">Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Enter your note title..."
            className="field-input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink-900 sm:text-base">Description</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Enter your note description..."
            className="field-textarea"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:mt-6 sm:flex-row">
        <MotionButton
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="primary-btn w-full rounded-[14px] px-5 font-semibold disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-36"
        >
          {submitLabel}
        </MotionButton>
        {secondaryAction}
      </div>
    </MotionForm>
  )
}

export default NoteForm
