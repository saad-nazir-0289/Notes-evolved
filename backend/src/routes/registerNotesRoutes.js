import { createNotesController } from "../controllers/createNotesController.js";
import { createRequireAuth } from "../middleware/requireAuth.js";
import {
  validateNoteBody,
  validateNoteId,
  validateNoteSearchQuery,
  validateNoteSortQuery,
  validateNotePaginationQuery,
} from "../middleware/noteValidation.js";

export const registerNotesRoutes = (router, Note, { User, jwtSecret } = {}) => {
  const requireAuth = createRequireAuth(User, { jwtSecret });
  const { getNotes, getNote, updateNote, createNote, deleteNote } = createNotesController(Note);
  router.get("/", requireAuth, validateNoteSearchQuery, validateNoteSortQuery, validateNotePaginationQuery, getNotes);
  router.get("/:id", requireAuth, validateNoteId, getNote);
  router.put("/:id", requireAuth, validateNoteId, validateNoteBody({ partial: true }), updateNote);
  router.post("/", requireAuth, validateNoteBody(), createNote);
  router.delete("/:id", requireAuth, validateNoteId, deleteNote);
  return router;
};
