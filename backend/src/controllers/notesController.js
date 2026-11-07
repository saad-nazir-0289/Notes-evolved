import Note from "../model/note.js";
import asyncHandler from "../middleware/asyncHandler.js";

const noteNotFound = () => Object.assign(new Error("Note not found"), { status: 404 });

export const getNotes = asyncHandler(async (_req, res) => {
  const notes = await Note.find().sort({ createdAt: -1 });
  return res.status(200).json({ message: "Notes found successfully", notes });
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    throw noteNotFound();
  }

  return res.status(200).json({ message: "Note found successfully", note });
});

export const updateNote = asyncHandler(async (req, res) => {
  const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!updatedNote) {
    throw noteNotFound();
  }

  return res.status(200).json(updatedNote);
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await Note.create(req.body);
  return res.status(201).json(note);
});

export const deleteNote = asyncHandler(async (req, res) => {
  const deletedNote = await Note.findByIdAndDelete(req.params.id);

  if (!deletedNote) {
    throw noteNotFound();
  }

  return res.status(200).json({ message: "Note deleted successfully" });
});
