import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NotesContext } from './notesContext'
import {
  createNote as createNoteApi,
  deleteNote as deleteNoteApi,
  getNotes,
  updateNote as updateNoteApi,
} from '../api/notes'
import { useRateLimit } from './useRateLimit'

const DEFAULT_SORT_OPTIONS = { sortBy: 'createdAt', sortOrder: 'desc' }

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [sortOptions, setSortOptions] = useState(DEFAULT_SORT_OPTIONS)
  const hasFetchedRef = useRef(false)
  const listRequestRef = useRef(0)
  const searchRequestRef = useRef(0)
  const { clearRateLimit, handleRateLimitError } = useRateLimit()

  const fetchNotes = useCallback(async (nextSortOptions = sortOptions) => {
    const requestId = ++listRequestRef.current
    searchRequestRef.current += 1
    setSearchResults(null)
    setSearchError(null)
    setSearchLoading(false)
    setSortOptions(nextSortOptions)
    try {
      setLoading(true)
      setFetchError(null)

      const data = await getNotes('', nextSortOptions)
      if (requestId !== listRequestRef.current) return
      setNotes(data)
      clearRateLimit()
    } catch (error) {
      if (requestId !== listRequestRef.current) return
      console.error('Error fetching notes:', error)

      if (handleRateLimitError(error)) {
        setFetchError('rate-limit')
      } else {
        setFetchError('general')
      }
    } finally {
      if (requestId === listRequestRef.current) setLoading(false)
    }
  }, [clearRateLimit, handleRateLimitError, sortOptions])

  useEffect(() => {
    if (hasFetchedRef.current) {
      return
    }

    hasFetchedRef.current = true
    fetchNotes()
  }, [fetchNotes])

  const searchNotes = useCallback(async (query, nextSortOptions = sortOptions) => {
    const requestId = ++searchRequestRef.current
    const normalizedQuery = query.trim()

    setSearchResults(null)
    setSearchError(null)

    if (!normalizedQuery) {
      setSearchLoading(false)
      return
    }

    listRequestRef.current += 1
    setLoading(false)
    setSortOptions(nextSortOptions)
    setSearchLoading(true)

    try {
      const results = await getNotes(normalizedQuery, nextSortOptions)
      if (requestId === searchRequestRef.current) {
        setSearchResults(results)
        clearRateLimit()
      }
    } catch (error) {
      if (requestId === searchRequestRef.current) {
        setSearchError(handleRateLimitError(error) ? 'rate-limit' : 'general')
      }
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearchLoading(false)
      }
    }
  }, [clearRateLimit, handleRateLimitError, sortOptions])

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
      setSearchResults((currentResults) => currentResults?.filter((note) => note.id !== id) ?? currentResults)
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
    searchResults,
    searchLoading,
    searchError,
    sortOptions,
    searchNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
  }), [
    notes,
    loading,
    fetchError,
    fetchNotes,
    searchResults,
    searchLoading,
    searchError,
    sortOptions,
    searchNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
  ])


  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
