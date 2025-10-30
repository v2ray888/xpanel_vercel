import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'
import { authApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username?: string, referralCode?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          // Verify token is still valid
          const response = await authApi.me()
          if (response.data.success) {
            setUser(response.data.data)
            localStorage.setItem('user', JSON.stringify(response.data.data))
          }
        } catch (error: any) {
          // Token is invalid or expired, clear storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setUser(null)
          // Redirect to login page if we were on a protected route
          if (window.location.pathname.startsWith('/user') || window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login'
          }
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      
      if (response.data.success) {
        const { user: userData, token } = response.data.data
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        
        toast.success('登录成功')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败'
      toast.error(message)
      throw error
    }
  }

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/admin-login', { email, password })
      
      if (response.data.success) {
        const { user: userData, token } = response.data.data
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        
        toast.success('管理员登录成功')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败'
      toast.error(message)
      throw error
    }
  }

  const register = async (email: string, password: string, username?: string, referralCode?: string) => {
    try {
      const response = await authApi.register({
        email,
        password,
        username,
        referral_code: referralCode,
      })
      
      if (response.data.success) {
        const { user: userData, token } = response.data.data
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        
        toast.success('注册成功')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '注册失败'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('已退出登录')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    loading,
    login,
    adminLogin,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}