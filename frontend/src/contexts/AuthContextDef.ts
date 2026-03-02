import { createContext } from 'react'

export interface AuthContextType {
  user: any
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isAdmin: () => boolean
  isAuthenticated: () => boolean
  getAuthHeaders: () => Record<string, string>
}

export const AuthContext = createContext<AuthContextType | null>(null)
