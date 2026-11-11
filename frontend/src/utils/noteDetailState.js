export const getNoteDetailState = ({ isLoading, note }) => {
  if (isLoading) return "loading";
  return note ? "ready" : "missing";
};
