import { createNotesController } from "../controllers/createNotesController.js";
import { validateNoteBody, validateNoteId } from "../middleware/noteValidation.js";

export const registerNotesRoutes = (router, Note) => {
  const { getNotes, getNote, updateNote, createNote, deleteNote } = createNotesController(Note);

  router.get("/", getNotes);
  router.get("/:id", validateNoteId, getNote);
  router.put("/:id", validateNoteId, validateNoteBody({ partial: true }), updateNote);
  router.post("/", validateNoteBody(), createNote);
  router.delete("/:id", validateNoteId, deleteNote);

  return router;
};
