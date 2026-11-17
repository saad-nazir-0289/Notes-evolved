export const NOTE_SORT_FIELDS = Object.freeze(["createdAt", "updatedAt", "title"]);
export const NOTE_SORT_ORDERS = Object.freeze(["asc", "desc"]);
export const DEFAULT_NOTE_SORT = Object.freeze({ sortBy: "createdAt", sortOrder: "desc" });

export const createNoteSort = (
  sortBy = DEFAULT_NOTE_SORT.sortBy,
  sortOrder = DEFAULT_NOTE_SORT.sortOrder,
) => {
  const field = NOTE_SORT_FIELDS.includes(sortBy) ? sortBy : DEFAULT_NOTE_SORT.sortBy;
  const direction = sortOrder === "asc" ? 1 : -1;
  return { [field]: direction, _id: direction };
};
