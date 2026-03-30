import { motion } from 'framer-motion'
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import NoteForm from "../components/NoteForm"
import PageHeader from "../components/PageHeader"
import { useNotes } from "../context/useNotes"
import { useRateLimit } from "../context/useRateLimit"

const MotionMain = motion.main

function CreateNotePage() {
  const navigate = useNavigate()
  const { createNote } = useNotes()
  const { handleRateLimitError } = useRateLimit()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description")
      return
    }

    try {
      setSubmitting(true)

      const note = await createNote({
        title: title.trim(),
        description: description.trim(),
      })

      toast.success("Note created successfully")
      navigate(`/notes/${note.id}`)
    } catch (error) {
      if (handleRateLimitError(error)) return
      toast.error("Unable to create note")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <MotionMain className="pb-6 sm:pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <PageHeader title="Create New Note" showBack />
        <div className="page-wrap">
          <NoteForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onSubmit={handleSubmit}
            submitLabel={submitting ? "Creating..." : "Create Note"}
            isSubmitting={submitting}
          />
        </div>
      </MotionMain>
    </>
  )
}

export default CreateNotePage
