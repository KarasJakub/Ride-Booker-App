import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
    //TODO: move to env variable
  baseURL: 'http://localhost:3000',
  withCredentials: true,
})

// add JWT into each request if exists
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// handle 401 errors and try to refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { data } = await axios.post(
          'http://localhost:3000/auth/refresh',
          {},
          { withCredentials: true }
        )

        useAuthStore.getState().setAuth(data.user, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api