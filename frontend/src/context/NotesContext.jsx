import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NotesContext } from './notesContext'
import {
  createNote as createNoteApi,
  deleteNote as deleteNoteApi,
  getNotes,
  updateNote as updateNoteApi,
} from '../api/notes'
import { normalizeNotePagination } from '../utils/notePagination'
import { useRateLimit } from './useRateLimit'
import { useAuth } from './AuthContext'

const DEFAULT_SORT_OPTIONS = { sortBy: 'createdAt', sortOrder: 'desc' }
const EMPTY_PAGINATION = normalizeNotePagination(null, [])

export function NotesProvider({ children }) {
  const { status: authStatus, sessionVersion } = useAuth()
  const [notes, setNotes] = useState([])
  const [notesPagination, setNotesPagination] = useState(EMPTY_PAGINATION)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [searchPagination, setSearchPagination] = useState(EMPTY_PAGINATION)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOptions, setSortOptions] = useState(DEFAULT_SORT_OPTIONS)
  const hasFetchedRef = useRef(false)
  const sessionVersionRef = useRef(sessionVersion)
  const listRequestRef = useRef(0)
  const searchRequestRef = useRef(0)
  const { clearRateLimit, handleRateLimitError } = useRateLimit()

  const resetNotesState = useCallback(() => {
    listRequestRef.current += 1
    searchRequestRef.current += 1
    hasFetchedRef.current = false
    setNotes([])
    setNotesPagination(EMPTY_PAGINATION)
    setLoading(false)
    setFetchError(null)
    setSearchResults(null)
    setSearchPagination(EMPTY_PAGINATION)
    setSearchLoading(false)
    setSearchError(null)
    setSearchQuery('')
  }, [])

  const fetchNotes = useCallback(async (nextSortOptions = sortOptions, page = 1) => {
    const requestId = ++listRequestRef.current
    searchRequestRef.current += 1
    setSearchResults(null)
    setSearchPagination(EMPTY_PAGINATION)
    setSearchQuery('')
    setSearchError(null)
    setSearchLoading(false)
    setSortOptions(nextSortOptions)
    try {
      setLoading(true)
      setFetchError(null)
      const result = await getNotes('', nextSortOptions, { page })
      if (requestId !== listRequestRef.current) return null
      setNotes(result.notes)
      setNotesPagination(result.pagination)
      clearRateLimit()
      return result.pagination
    } catch (error) {
      if (requestId !== listRequestRef.current) return null
      console.error('Error fetching notes:', error)
      setFetchError(handleRateLimitError(error) ? 'rate-limit' : 'general')
      return null
    } finally {
      if (requestId === listRequestRef.current) setLoading(false)
    }
  }, [clearRateLimit, handleRateLimitError, sortOptions])

  useEffect(() => {
    const sessionChanged = sessionVersionRef.current !== sessionVersion
    if (sessionChanged) {
      sessionVersionRef.current = sessionVersion
      resetNotesState()
    }

    if (authStatus === 'authenticated' && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchNotes()
    } else if (authStatus === 'unauthenticated' && !sessionChanged) {
      resetNotesState()
    }
  }, [authStatus, sessionVersion, fetchNotes, resetNotesState])

  const searchNotes = useCallback(async (query, nextSortOptions = sortOptions, page = 1) => {
    const requestId = ++searchRequestRef.current
    const normalizedQuery = query.trim()
    setSearchResults(null)
    setSearchPagination(EMPTY_PAGINATION)
    setSearchError(null)
    setSearchQuery(normalizedQuery)

    if (!normalizedQuery) {
      setSearchLoading(false)
      return null
    }

    listRequestRef.current += 1
    setLoading(false)
    setSortOptions(nextSortOptions)
    setSearchLoading(true)

    try {
      const result = await getNotes(normalizedQuery, nextSortOptions, { page })
      if (requestId !== searchRequestRef.current) return null
      setSearchResults(result.notes)
      setSearchPagination(result.pagination)
      clearRateLimit()
      return result.pagination
    } catch (error) {
      if (requestId === searchRequestRef.current) {
        setSearchError(handleRateLimitError(error) ? 'rate-limit' : 'general')
      }
      return null
    } finally {
      if (requestId === searchRequestRef.current) setSearchLoading(false)
    }
  }, [clearRateLimit, handleRateLimitError, sortOptions])

  const createNote = useCallback(async ({ title, description }) => {
    const newNote = await createNoteApi({ title, description })
    await fetchNotes(sortOptions, 1)
    return newNote
  }, [fetchNotes, sortOptions])

  const updateNote = useCallback(async (id, payload) => {
    const updatedNote = await updateNoteApi(id, payload)
    setNotes((currentNotes) => currentNotes.map((note) => (note.id === id ? updatedNote : note)))
    setSearchResults((currentResults) =>
      currentResults?.map((note) => (note.id === id ? updatedNote : note)) ?? currentResults,
    )

    if (searchQuery) await searchNotes(searchQuery, sortOptions, searchPagination.page)
    else await fetchNotes(sortOptions, notesPagination.page)

    return updatedNote
  }, [fetchNotes, notesPagination.page, searchNotes, searchPagination.page, searchQuery, sortOptions])

  const deleteNote = useCallback(async (id) => {
    await deleteNoteApi(id)
    if (searchQuery) await searchNotes(searchQuery, sortOptions, searchPagination.page)
    else await fetchNotes(sortOptions, notesPagination.page)
  }, [fetchNotes, notesPagination, searchNotes, searchPagination, searchQuery, sortOptions])

  const getNoteById = useCallback((id) => (
    notes.find((note) => note.id === id) ?? searchResults?.find((note) => note.id === id)
  ), [notes, searchResults])

  const value = useMemo(() => ({
    notes,
    notesPagination,
    loading,
    fetchError,
    fetchNotes,
    searchResults,
    searchPagination,
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
    notesPagination,
    loading,
    fetchError,
    fetchNotes,
    searchResults,
    searchPagination,
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
