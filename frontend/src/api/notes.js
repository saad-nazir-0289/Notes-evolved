import api from "./axios"
import { NOTE_PAGE_SIZE, normalizeNotePagination } from "../utils/notePagination"

const normalizeNote = (note) => ({
    id: note._id,
    title: note.title,
    description: note.description,
    isPinned: note.isPinned === true,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
})

export const getNotes = async (searchTerm = "", sortOptions = {}, paginationOptions = {}) => {
    const page = paginationOptions.page ?? 1
    const limit = paginationOptions.limit ?? NOTE_PAGE_SIZE
    const params = {
        ...(searchTerm ? { q: searchTerm } : {}),
        ...sortOptions,
        page,
        limit,
    }
    const response = await api.get("/notes", { params })
    const notes = response.data.data.map(normalizeNote)
    return {
        notes,
        pagination: normalizeNotePagination(response.data.meta?.pagination, notes),
    }
}

export const getNote = async (id) => {
    const response = await api.get("/notes/" + id)
    return normalizeNote(response.data.data)
}

export const createNote = async (noteData) => {
    const response = await api.post("/notes", noteData)
    return normalizeNote(response.data.data)
}

export const updateNote = async (id, noteData) => {
    const response = await api.put("/notes/" + id, noteData)
    return normalizeNote(response.data.data)
}

export const deleteNote = async (id) => {
    const response = await api.delete("/notes/" + id)
    return response.data
}
