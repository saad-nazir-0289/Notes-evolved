import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import CreateNotePage from './pages/CreateNotePage'
import HomePage from './pages/HomePage'
import NoteDetailPage from './pages/NoteDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateNotePage />} />
        <Route path="/notes/:noteId" element={<NoteDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
