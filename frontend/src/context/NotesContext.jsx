import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NotesContext } from './notesContext'
import {
  createNote as createNoteApi,
  deleteNote as deleteNoteApi,
  getNotes,
  updateNote as updateNoteApi,
} from '../api/notes'
import { useRateLimit } from './useRateLimit'

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const hasFetchedRef = useRef(false)
  const { clearRateLimit, handleRateLimitError } = useRateLimit()

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)

      const data = await getNotes()
      setNotes(data)
      clearRateLimit()
    } catch (error) {
      console.error('Error fetching notes:', error)

      if (handleRateLimitError(error)) {
        setFetchError('rate-limit')
      } else {
        setFetchError('general')
      }
    } finally {
      setLoading(false)
    }
  }, [clearRateLimit, handleRateLimitError])

  useEffect(() => {
    if (hasFetchedRef.current) {
      return
    }

    hasFetchedRef.current = true
    fetchNotes()
  }, [fetchNotes])

  const createNote = useCallback(async ({ title, description }) => {
    const tempId = `temp-${crypto.randomUUID()}`
    const optimisticNote = {
      id: tempId,
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setNotes((currentNotes) => [optimisticNote, ...currentNotes])

    try {
      const newNote = await createNoteApi({ title, description })
      setNotes((currentNotes) => currentNotes.map((note) => (note.id === tempId ? newNote : note)))
      return newNote
    } catch (error) {
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== tempId))
      throw error
    }
  }, [])

  const updateNote = useCallback(async (id, payload) => {
    const previousNote = notes.find((note) => note.id === id)
    const optimisticNote = previousNote
      ? {
          ...previousNote,
          ...payload,
          updatedAt: new Date().toISOString(),
        }
      : null

    if (optimisticNote) {
      setNotes((currentNotes) =>
        currentNotes.map((note) => (note.id === id ? optimisticNote : note)),
      )
    }

    try {
      const updatedNote = await updateNoteApi(id, payload)

      setNotes((currentNotes) =>
        currentNotes.map((note) => (note.id === id ? updatedNote : note)),
      )

      return updatedNote
    } catch (error) {
      if (previousNote) {
        setNotes((currentNotes) => currentNotes.map((note) => (note.id === id ? previousNote : note)))
      }

      throw error
    }
  }, [notes])

  const deleteNote = useCallback(async (id) => {
    const previousNotes = notes
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id))

    try {
      await deleteNoteApi(id)
    } catch (error) {
      setNotes(previousNotes)
      throw error
    }
  }, [notes])

  const getNoteById = useCallback((id) => notes.find((note) => note.id === id), [notes])

  const value = useMemo(() => ({
    notes,
    loading,
    fetchError,
    fetchNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
  }), [notes, loading, fetchError, fetchNotes, getNoteById, createNote, updateNote, deleteNote])


  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
