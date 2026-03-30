import express from "express";
import { getNotes, updateNote, createNote, deleteNote, getNote } from "../controllers/notesController.js";

const router = express.Router();

router.get("/", getNotes)
router.get("/:id", getNote)
router.put("/:id", updateNote)
router.post("/", createNote)
router.delete("/:id", deleteNote)

export default router;