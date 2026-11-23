import api from './axios'

const unwrap = (response) => {
  const payload = response.data
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.message || 'The authentication request could not be completed')
  }
  return payload.data
}

export const register = async (credentials) => unwrap(await api.post('/auth/register', credentials))
export const login = async (credentials) => unwrap(await api.post('/auth/login', credentials))
export const getCurrentUser = async () => unwrap(await api.get('/auth/me'))
