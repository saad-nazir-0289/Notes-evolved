import express from "express";
import Note from "../model/note.js";
import { registerNotesRoutes } from "./registerNotesRoutes.js";

const router = express.Router();

export default registerNotesRoutes(router, Note);
