import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { NotesProvider } from './context/NotesContext.jsx'
import { RateLimitProvider } from './context/RateLimitProvider'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <RateLimitProvider>
      <NotesProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2500,
            className: 'rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 shadow-lg',
            success: {
              iconTheme: {
                primary: '#2954d1',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc3c45',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </NotesProvider>
    </RateLimitProvider>
  </BrowserRouter>,
)
