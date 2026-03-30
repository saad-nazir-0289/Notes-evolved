import Note from "../model/note.js"

export const getNotes = async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 })
        res.status(200).json({ message: "Notes found successfully", notes })
    } catch (error) {
        res.status(500).json({ message: "Error in get Notes" })
    }
}

export const getNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) {
            return res.status(404).json({ message: "Note not found" })
        }
        res.status(200).json({ message: "Note found successfully", note })
    } catch (error) {
        res.status(500).json({ message: "Error in get Note" })
    }
}
export const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) {
            return res.status(404).json({ message: "Note not found" })
        }
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json(updatedNote)
    } catch (error) {
        res.status(500).json({ message: "Error in update Note" })
    }

}

export const createNote = async (req, res) => {
    try {
        const note = await Note.create(req.body)
        res.status(201).json(note)
    } catch (error) {
        res.status(500).json({ message: "Error in create Note" })
    }
}

export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) {
            return res.status(404).json({ message: "Note not found" })
        }
        await Note.findByIdAndDelete(req.params.id)
        res.status(200).json({ message: "Note deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Error in delete Note" })
    }
}