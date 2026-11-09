import Note from "../model/note.js";
import { createNotesController } from "./createNotesController.js";

const controllers = createNotesController(Note);

export const { getNotes, getNote, updateNote, createNote, deleteNote } = controllers;
