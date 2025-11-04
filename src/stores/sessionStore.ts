import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, StartSessionRequest, EndSessionRequest, UseSessionRequest, ExtendSessionRequest } from '../types/api'
import { SessionApi, ApiServiceError } from '../services/api'

export const useSessionStore = defineStore('session', () => {
  // State
  const currentSession = ref<Session | null>(null)
  const sessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isSessionActive = computed(() => !!sessionId.value && !!currentSession.value)

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const setSession = (session: Session | null) => {
    currentSession.value = session
  }

  const setSessionId = (id: string | null) => {
    sessionId.value = id
    if (id) {
      localStorage.setItem('session_id', id)
    } else {
      localStorage.removeItem('session_id')
    }
  }

  const initializeSession = () => {
    const savedSessionId = localStorage.getItem('session_id')
    if (savedSessionId) {
      sessionId.value = savedSessionId
      // Note: In a real app, you'd validate the session with the server
    }
  }

  const startSession = async (userId: string) => {
    loading.value = true
    clearError()
    try {
      const request: StartSessionRequest = { u: userId }
      const response = await SessionApi.startSession(request)
      setSessionId(response.session)
      // Note: We don't get the full session object from the API
      // We'll create a basic session object
      setSession({
        _id: response.session,
        userID: userId,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to start session'
      setError(errorMessage)
      console.error('Error starting session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const endSession = async () => {
    if (!sessionId.value) return

    loading.value = true
    clearError()
    try {
      const request: EndSessionRequest = { s: sessionId.value }
      const response = await SessionApi.endSession(request)
      setSession(null)
      setSessionId(null)
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to end session'
      setError(errorMessage)
      console.error('Error ending session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const useSession = async () => {
    if (!sessionId.value) return false

    loading.value = true
    clearError()
    try {
      const request: UseSessionRequest = { s: sessionId.value }
      const response = await SessionApi.useSession(request)
      return response.success
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to use session'
      setError(errorMessage)
      console.error('Error using session:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const extendSession = async () => {
    if (!sessionId.value) return

    loading.value = true
    clearError()
    try {
      const request: ExtendSessionRequest = { s: sessionId.value }
      const response = await SessionApi.extendSession(request)
      setSessionId(response.session)
      // Update the session object with new expiry time
      if (currentSession.value) {
        currentSession.value._id = response.session
        currentSession.value.expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to extend session'
      setError(errorMessage)
      console.error('Error extending session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const expireSessions = async () => {
    loading.value = true
    clearError()
    try {
      const response = await SessionApi.expireSessions()
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to expire sessions'
      setError(errorMessage)
      console.error('Error expiring sessions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkSessionValidity = async () => {
    if (!sessionId.value) return false

    try {
      const isValid = await useSession()
      if (!isValid) {
        setSession(null)
        setSessionId(null)
      }
      return isValid
    } catch (err) {
      console.error('Error checking session validity:', err)
      setSession(null)
      setSessionId(null)
      return false
    }
  }

  const clearSessionError = () => {
    clearError()
  }

  return {
    // State
    currentSession,
    sessionId,
    loading,
    error,
    // Getters
    isSessionActive,
    // Actions
    startSession,
    endSession,
    useSession,
    extendSession,
    expireSessions,
    checkSessionValidity,
    initializeSession,
    setSession,
    setSessionId,
    setError,
    clearError,
    clearSessionError
  }
})


