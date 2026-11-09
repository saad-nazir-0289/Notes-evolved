import asyncHandler from "../middleware/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

const noteNotFound = () => Object.assign(new Error("Note not found"), { status: 404 });

export const createNotesController = (Note) => ({
  getNotes: asyncHandler(async (_req, res) => {
    const notes = await Note.find().sort({ createdAt: -1 });
    return res.status(200).json(successResponse("Notes found successfully", notes));
  }),

  getNote: asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
      throw noteNotFound();
    }

    return res.status(200).json(successResponse("Note found successfully", note));
  }),

  updateNote: asyncHandler(async (req, res) => {
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedNote) {
      throw noteNotFound();
    }

    return res.status(200).json(successResponse("Note updated successfully", updatedNote));
  }),

  createNote: asyncHandler(async (req, res) => {
    const note = await Note.create(req.body);
    return res.status(201).json(successResponse("Note created successfully", note));
  }),

  deleteNote: asyncHandler(async (req, res) => {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);

    if (!deletedNote) {
      throw noteNotFound();
    }

    return res.status(200).json(successResponse("Note deleted successfully"));
  }),
});
