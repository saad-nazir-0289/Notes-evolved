import express from "express";
import { getNotes, updateNote, createNote, deleteNote, getNote } from "../controllers/notesController.js";
import { validateNoteBody, validateNoteId } from "../middleware/noteValidation.js";

const router = express.Router();

router.get("/", getNotes);
router.get("/:id", validateNoteId, getNote);
router.put("/:id", validateNoteId, validateNoteBody({ partial: true }), updateNote);
router.post("/", validateNoteBody(), createNote);
router.delete("/:id", validateNoteId, deleteNote);

export default router;
