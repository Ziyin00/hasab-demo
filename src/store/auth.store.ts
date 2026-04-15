import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'
import { User, LoginResponse, ProfileResponse } from '@/types/api.types'
import { toast } from 'sonner'

interface Toast {
  id: number
  message: string
  description?: string
  status: 'success' | 'error' | 'info' | 'warning'
}

interface AuthState {
  theme: string
  setTheme: (theme: string) => void
  toggleTheme: () => void
  
  toasts: Toast[]
  addToast: (message: string, description?: string, status?: Toast['status']) => void
  removeToast: (id: number) => void
  
  loadingState: boolean
  initialized: boolean
  authenticated: boolean
  user: User | null
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
  
  login: (tokens: LoginResponse) => Promise<void>
  logout: () => Promise<void>
  isAccessTokenExpired: () => boolean
  isRefreshTokenExpired: () => boolean
  init: () => Promise<void>
}

const fetchUserDetails = async (token: string): Promise<User> => {
  const response = await apiClient.get<ProfileResponse>('/profile', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.data.user
}

export const useAuthStore = create<AuthState>((set, get) => ({
  theme: (typeof window !== 'undefined' ? localStorage.getItem('theme') : 'dark') || 'dark',
  setTheme: theme => {
    set({ theme })
    localStorage.setItem('theme', theme)
  },
  toggleTheme: () => {
    set(state => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      return { theme: newTheme }
    })
  },
  
  toasts: [],
  addToast: (message, description, status = 'info') => {
    const id = Date.now()
    set(state => ({
      toasts: [...state.toasts, { id, message, status, description }]
    }))
    
    // Trigger sonner toast for visibility
    if (status === 'success') toast.success(message, { description })
    else if (status === 'error') toast.error(message, { description })
    else if (status === 'warning') toast.warning(message, { description })
    else toast.info(message, { description })

    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      }))
    }, 5000)
  },
  removeToast: id =>
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    })),
    
  loadingState: false,
  initialized: false,
  authenticated: typeof window !== 'undefined' ? !!localStorage.getItem('tokens') : false,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  accessTokenExpiresAt: typeof window !== 'undefined' ? localStorage.getItem('accessTokenExpiresAt') : null,
  refreshTokenExpiresAt: typeof window !== 'undefined' ? localStorage.getItem('refreshTokenExpiresAt') : null,

  login: async tokens => {
    set({ loadingState: true })
    localStorage.setItem('tokens', JSON.stringify(tokens))
    localStorage.setItem('accessTokenExpiresAt', tokens.access_token_expires_at)
    localStorage.setItem('refreshTokenExpiresAt', tokens.refresh_token_expires_at)
    
    try {
      const user = await fetchUserDetails(tokens.access_token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Set cookie for middleware
      if (typeof window !== 'undefined') {
        document.cookie = `auth_token=${tokens.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      set({
        authenticated: true,
        user,
        accessTokenExpiresAt: tokens.access_token_expires_at,
        refreshTokenExpiresAt: tokens.refresh_token_expires_at
      })
    } catch (error) {
      console.error('Failed to fetch user details:', error)
      set({ authenticated: false, user: null })
      throw error 
    } finally {
      set({ loadingState: false })
    }
  },

  logout: async () => {
    localStorage.removeItem('tokens')
    localStorage.removeItem('user')
    localStorage.removeItem('accessTokenExpiresAt')
    localStorage.removeItem('refreshTokenExpiresAt')
    localStorage.removeItem('styles')
    localStorage.removeItem('editor-storage')
    
    // Clear cookie
    if (typeof window !== 'undefined') {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    set({ authenticated: false, user: null, loadingState: false })
  },

  isAccessTokenExpired: () => {
    const accessTokenExpiresAt = get().accessTokenExpiresAt
    if (!accessTokenExpiresAt) return true
    return new Date(accessTokenExpiresAt) < new Date()
  },
  
  isRefreshTokenExpired: () => {
    const refreshTokenExpiresAt = get().refreshTokenExpiresAt
    if (!refreshTokenExpiresAt) return true
    return new Date(refreshTokenExpiresAt) < new Date()
  },

  init: async () => {
    if (typeof window === 'undefined') return

    set({ loadingState: true })
    const tokensStr = localStorage.getItem('tokens')
    const tokens = tokensStr ? JSON.parse(tokensStr) : null
    const accessTokenExpiresAt = localStorage.getItem('accessTokenExpiresAt') || null
    const refreshTokenExpiresAt = localStorage.getItem('refreshTokenExpiresAt') || null
    
    if (tokens && accessTokenExpiresAt && refreshTokenExpiresAt) {
      if (get().isRefreshTokenExpired()) {
        get().logout()
      } else if (get().isAccessTokenExpired()) {
        try {
          const response = await apiClient.post<LoginResponse>(
            '/auth/refresh',
            { refresh_token: tokens.refresh_token }
          )
          const newTokens: LoginResponse = {
            ...tokens,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            access_token_expires_at: response.data.access_token_expires_at,
            refresh_token_expires_at: response.data.refresh_token_expires_at
          }
          await get().login(newTokens)
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
        }
      } else {
        // Token is valid but might be missing cookie (newly added middleware)
        if (typeof window !== 'undefined' && !document.cookie.includes('auth_token=')) {
          document.cookie = `auth_token=${tokens.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        if (!get().user) {
          try {
              const user = await fetchUserDetails(tokens.access_token)
              localStorage.setItem('user', JSON.stringify(user))
              set({ user, authenticated: true })
          } catch {
              get().logout()
          }
        }
      }
    } else {
      get().logout()
    }
    set({ initialized: true, loadingState: false })
  },
}))
