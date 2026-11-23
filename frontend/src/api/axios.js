import axios from 'axios'
import { readAccessToken } from '../utils/authSession'

const BASE_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api'
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  else if (config.headers) delete config.headers.Authorization
  return config
})

export default api
