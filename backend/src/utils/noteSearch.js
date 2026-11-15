const escapeRegex = (value) => value.replace(/[.*+?^()|[\]{}$\\]/g, "\\$&");

export const createNoteSearchFilter = (term = "") => {
  const normalizedTerm = typeof term === "string" ? term.trim() : "";

  if (!normalizedTerm) return {};

  const pattern = escapeRegex(normalizedTerm);
  return {
    $or: [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
    ],
  };
};
