import api from "./axios"

const normalizeNote = (note) => ({
    id: note._id,
    title: note.title,
    description: note.description,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
})

export const getNotes = async () => {
    const response = await api.get("/notes")
    return response.data.notes.map(normalizeNote)
}

export const createNote = async (noteData) => {
    const response = await api.post("/notes", noteData)
    return normalizeNote(response.data)
}

export const updateNote = async (id, noteData) => {
    const response = await api.put(`/notes/${id}`, noteData)
    return normalizeNote(response.data)
}

export const deleteNote = async (id) => {
    const response = await api.delete(`/notes/${id}`)
    return response.data
}