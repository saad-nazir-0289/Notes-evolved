import api from "./axios"

const normalizeNote = (note) => ({
    id: note._id,
    title: note.title,
    description: note.description,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
})

export const getNotes = async (searchTerm = "", sortOptions = {}) => {
    const params = {
        ...(searchTerm ? { q: searchTerm } : {}),
        ...sortOptions,
    }
    const response = await api.get("/notes", { params })
    return response.data.data.map(normalizeNote)
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
