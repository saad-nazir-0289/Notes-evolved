import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import Navbar from '../components/Navbar'
import NoteCard from '../components/NoteCard'
import { useNotes } from '../context/useNotes'
import { useRateLimit } from '../context/useRateLimit'
import { NOTE_SORT_OPTIONS, parseNoteSortValue } from '../utils/noteSort'

const MotionMain = motion.main
const MotionDiv = motion.div

function HomePage() {
  const {
    notes,
    loading,
    fetchError,
    fetchNotes,
    sortOptions,
    searchResults,
    searchLoading,
    searchError,
    searchNotes,
    deleteNote,
  } = useNotes()
  const { clearRateLimit, handleRateLimitError } = useRateLimit()
  const [searchTerm, setSearchTerm] = useState('')
  const sortValue = `${sortOptions.sortBy}:${sortOptions.sortOrder}`
  const [searchDebouncing, setSearchDebouncing] = useState(false)
  const searchTimerRef = useRef(null)
  const isSearching = searchTerm.trim().length > 0
  const displayedNotes = isSearching ? (searchResults ?? []) : notes
  const isLoading = loading || (isSearching && (searchDebouncing || searchLoading))
  const currentError = isSearching ? searchError : fetchError

  const refreshListOnMountRef = useRef(
    searchResults !== null || searchLoading || searchError !== null,
  )
  const initialSortOptionsRef = useRef(sortOptions)
  const fetchNotesOnMountRef = useRef(fetchNotes)

  useEffect(() => {
    if (refreshListOnMountRef.current) {
      fetchNotesOnMountRef.current(initialSortOptionsRef.current)
    }
  }, [])

  useEffect(() => () => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
    }
  }, [])

  const handleSearchChange = (event) => {
    const nextQuery = event.target.value
    const currentSort = parseNoteSortValue(sortValue)
    setSearchTerm(nextQuery)
    searchNotes('')

    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
    }

    if (!nextQuery.trim()) {
      setSearchDebouncing(false)
      searchTimerRef.current = null
      fetchNotes(currentSort)
      return
    }

    setSearchDebouncing(true)
    searchTimerRef.current = window.setTimeout(() => {
      setSearchDebouncing(false)
      searchNotes(nextQuery, currentSort)
      searchTimerRef.current = null
    }, 250)
  }

  const handleSortChange = (event) => {
    const nextSortValue = event.target.value
    const sortOptions = parseNoteSortValue(nextSortValue)
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }
    setSearchDebouncing(false)

    if (isSearching) searchNotes(searchTerm, sortOptions)
    else fetchNotes(sortOptions)
  }

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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-xl">
            <label className="sr-only" htmlFor="note-search">Search notes</label>
            <div className="relative">
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                id="note-search"
                type="search"
                maxLength={100}
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by title or content..."
                className="field-input pl-10"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label className="sr-only" htmlFor="note-sort">Sort notes</label>
            <select
              id="note-sort"
              value={sortValue}
              onChange={handleSortChange}
              className="field-input"
            >
              {NOTE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
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
        ) : currentError === 'rate-limit' ? (
          <MotionDiv
            role="status"
            className="glass-panel mx-auto max-w-md p-4 text-center text-sm text-ink-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSearching
              ? 'Search is temporarily unavailable because too many requests were sent.'
              : 'Notes are temporarily unavailable because too many requests were sent.'}
          </MotionDiv>
        ) : currentError === 'general' ? (
          <MotionDiv
            role="status"
            className="glass-panel mx-auto max-w-md p-4 text-center text-sm text-ink-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSearching ? 'Unable to search notes right now.' : 'Unable to load notes right now.'}
          </MotionDiv>
        ) : displayedNotes.length ? (
          <MotionDiv layout className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {displayedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </MotionDiv>
        ) : isSearching ? (
          <MotionDiv
            role="status"
            className="glass-panel mx-auto max-w-md p-4 text-center text-sm text-ink-700"
          >
            No notes match "{searchTerm.trim()}".
          </MotionDiv>
        ) : (
          <EmptyState />
        )}
      </MotionMain>
    </>
  )
}

export default HomePage
