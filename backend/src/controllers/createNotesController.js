import asyncHandler from "../middleware/asyncHandler.js";
import { NOTE_DEFAULT_PAGE_SIZE } from "../config/noteConstraints.js";
import { successResponse } from "../utils/apiResponse.js";
import { createNoteSearchFilter } from "../utils/noteSearch.js";
import { createNoteSort } from "../utils/noteSorting.js";

const noteNotFound = () => Object.assign(new Error("Note not found"), { status: 404 });

export const createNotesController = (Note) => ({
  getNotes: asyncHandler(async (req, res) => {
    const filter = createNoteSearchFilter(req.noteSearchTerm);
    const sort = req.noteSort ?? createNoteSort();
    const requestedPage = req.notePagination?.page ?? 1;
    const limit = req.notePagination?.limit ?? NOTE_DEFAULT_PAGE_SIZE;
    const total = await Note.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const page = Math.min(requestedPage, Math.max(totalPages, 1));
    const skip = (page - 1) * limit;
    const notes = await Note.find(filter).sort(sort).skip(skip).limit(limit);

    return res.status(200).json(successResponse("Notes found successfully", notes, {
      pagination: { page, limit, total, totalPages },
    }));
  }),

  getNote: asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);
    if (!note) throw noteNotFound();
    return res.status(200).json(successResponse("Note found successfully", note));
  }),

  updateNote: asyncHandler(async (req, res) => {
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedNote) throw noteNotFound();
    return res.status(200).json(successResponse("Note updated successfully", updatedNote));
  }),

  createNote: asyncHandler(async (req, res) => {
    const note = await Note.create(req.body);
    return res.status(201).json(successResponse("Note created successfully", note));
  }),

  deleteNote: asyncHandler(async (req, res) => {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) throw noteNotFound();
    return res.status(200).json(successResponse("Note deleted successfully"));
  }),
});
