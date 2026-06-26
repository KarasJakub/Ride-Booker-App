import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')

      if (isAuthEndpoint) {
        return Promise.reject(error)
      }
      originalRequest._retry = true

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const currentUser = useAuthStore.getState().user
        useAuthStore.getState().setAuth(currentUser!, data.accessToken)

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${data.accessToken}`
        }

        return api(originalRequest)
      } catch {
        useAuthStore.getState().clearAuth()
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api