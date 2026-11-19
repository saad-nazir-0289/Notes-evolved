import { motion } from 'framer-motion'
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import NoteDetailPanel from "../components/NoteDetailPanel"
import PageHeader from "../components/PageHeader"
import { getNote as getNoteApi } from "../api/notes"
import { useNotes } from "../context/useNotes"
import { useRateLimit } from "../context/useRateLimit"
import { getNoteDetailState } from "../utils/noteDetailState"

const MotionMain = motion.main

function NoteDetailPage() {
  const navigate = useNavigate()
  const { noteId } = useParams()
  const { getNoteById, updateNote, deleteNote, loading } = useNotes()
  const { handleRateLimitError } = useRateLimit()
  const cachedNote = getNoteById(noteId)
  const [detailResult, setDetailResult] = useState({ noteId: null, status: 'loading', note: null })
  const currentDetailResult = detailResult.noteId === noteId
    ? detailResult
    : { status: 'loading', note: null }
  const note = cachedNote ?? currentDetailResult.note
  const isResolvingNote = !cachedNote
    && !currentDetailResult.note
    && !['not-found', 'error'].includes(currentDetailResult.status)
  const detailState = getNoteDetailState({ isLoading: loading || isResolvingNote, note })

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (cachedNote) {
      setDetailResult({ noteId, status: 'ready', note: null })
      return undefined
    }

    if (loading) return undefined

    let cancelled = false
    setDetailResult({ noteId, status: 'loading', note: null })

    getNoteApi(noteId)
      .then((fetchedNote) => {
        if (!cancelled) setDetailResult({ noteId, status: 'ready', note: fetchedNote })
      })
      .catch((error) => {
        if (cancelled) return
        setDetailResult({
          noteId,
          status: error.response?.status === 404 ? 'not-found' : 'error',
          note: null,
        })
      })

    return () => {
      cancelled = true
    }
  }, [cachedNote, loading, noteId])

  if (detailState === "loading") {
    return (
      <>
        <Navbar />
        <MotionMain
          className="pb-6 sm:pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="page-wrap py-4 sm:py-6" role="status" aria-live="polite">
            <div className="glass-panel p-4 text-sm text-ink-700">
              Loading note...
            </div>
          </div>
        </MotionMain>
      </>
    )
  }

  if (!note && currentDetailResult.status === 'error') {
    return (
      <>
        <Navbar />
        <MotionMain className="page-wrap py-4 sm:py-6">
          <div className="glass-panel p-4 text-sm text-ink-700" role="alert">
            Unable to load this note right now. Please try again.
          </div>
        </MotionMain>
      </>
    )
  }

  if (detailState === "missing") return <Navigate to="/" replace />

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
      const updatedNote = await updateNote(note.id, {
        title: title.trim(),
        description: description.trim(),
      })
      setDetailResult({ noteId, status: 'ready', note: updatedNote })
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
