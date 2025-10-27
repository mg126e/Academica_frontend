import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RegisterRequest, AuthenticateRequest, ConfirmRequest } from '../types/api'
import { UserAuthApi, ApiServiceError } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const setUser = (userData: User | null) => {
    user.value = userData
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('auth_user')
    }
  }

  const setToken = (tokenValue: string | null) => {
    token.value = tokenValue
    if (tokenValue) {
      localStorage.setItem('auth_token', tokenValue)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        // Note: In a real app, you'd validate the token with the server
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        token.value = null
        user.value = null
      }
    }
  }

  const register = async (request: RegisterRequest) => {
    loading.value = true
    clearError()
    try {
      const response = await UserAuthApi.register(request)
      // The API returns a user ID, use it as the "token" for authentication
      setToken(response.user)
      // Note: The API returns a user string, but we need to fetch the full user object
      // For now, we'll create a basic user object
      setUser({
        _id: response.user,
        username: request.username,
        email: request.email || '', // Handle empty email
        confirmed: false
      })
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to register user'
      setError(errorMessage)
      console.error('Error registering user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const authenticate = async (request: AuthenticateRequest) => {
    loading.value = true
    clearError()
    try {
      const response = await UserAuthApi.authenticate(request)
      
      // The API only returns a user ID, not a token
      // We'll use the user ID as a "token" for authentication purposes
      setToken(response.user)
      
      // Create a basic user object
      setUser({
        _id: response.user,
        username: request.username,
        email: '', // We don't have email from authenticate response
        confirmed: true // Assume confirmed if authentication succeeds
      })
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to authenticate user'
      setError(errorMessage)
      console.error('Error authenticating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const confirmEmail = async (request: ConfirmRequest) => {
    loading.value = true
    clearError()
    try {
      const response = await UserAuthApi.confirm(request)
      if (user.value) {
        user.value.confirmed = response.success
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to confirm email'
      setError(errorMessage)
      console.error('Error confirming email:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const clearAuthError = () => {
    clearError()
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    register,
    authenticate,
    confirmEmail,
    logout,
    initializeAuth,
    setError,
    clearError,
    clearAuthError
  }
})

