import mongoose from "mongoose";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from "../config/noteConstraints.js";

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: NOTE_TITLE_MAX_LENGTH,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: NOTE_DESCRIPTION_MAX_LENGTH,
  },
}, {
  timestamps: true,
});

const Note = mongoose.model("Note", noteSchema);

export default Note;
