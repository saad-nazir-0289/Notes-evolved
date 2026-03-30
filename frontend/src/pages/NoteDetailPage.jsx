import { motion } from 'framer-motion'
import { useState } from "react"
import toast from "react-hot-toast"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import NoteDetailPanel from "../components/NoteDetailPanel"
import PageHeader from "../components/PageHeader"
import { useNotes } from "../context/useNotes"
import { useRateLimit } from "../context/useRateLimit"

const MotionMain = motion.main

function NoteDetailPage() {
  const navigate = useNavigate()
  const { noteId } = useParams()
  const { getNoteById, updateNote, deleteNote } = useNotes()
  const { handleRateLimitError } = useRateLimit()

  const note = getNoteById(noteId)

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!note) {
    return <Navigate to="/" replace />
  }

  const handleStartEdit = () => {
    setTitle(note.title)
    setDescription(note.description)
    setIsEditing(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description")
      return
    }

    try {
      setSubmitting(true)
      await updateNote(note.id, {
        title: title.trim(),
        description: description.trim(),
      })

      setIsEditing(false)
      toast.success("Note updated successfully")
    } catch (error) {
      if (handleRateLimitError(error)) return
      toast.error("Unable to update note")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitting(true)
      await deleteNote(note.id)
      toast.success("Note deleted successfully")
      navigate("/")
    } catch (error) {
      if (handleRateLimitError(error)) return
      toast.error("Unable to delete note")
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <>
      <Navbar />
      <MotionMain className="pb-6 sm:pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <PageHeader title={isEditing ? "Edit Note" : "Note Detail"} showBack />
        <div className="page-wrap">
          <NoteDetailPanel
            note={note}
            isEditing={isEditing}
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onEditToggle={handleStartEdit}
            onCancelEdit={() => setIsEditing(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            isSubmitting={submitting}
          />
        </div>
      </MotionMain>
    </>
  )
}

export default NoteDetailPage
