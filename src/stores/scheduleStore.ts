import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Schedule } from '../types/api'
import { CourseSchedulingApi, ApiServiceError } from '../services/api'
import { useSessionStore } from './sessionStore'
import { useAuthStore } from './authStore'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Get auth store for current user
  const authStore = useAuthStore()
  const sessionStore = useSessionStore()
  
  // Get current user ID from auth store
  const currentUserId = computed(() => authStore.user?._id || '')

  // Getters
  const scheduleCount = computed(() => {
    return Array.isArray(schedules.value) ? schedules.value.length : 0
  })
  const userSchedules = computed(() => {
    if (!Array.isArray(schedules.value)) {
      return []
    }
    return schedules.value.filter(schedule => schedule.owner === currentUserId.value)
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // Remove setCurrentUserId since we now use computed currentUserId from auth store

  const fetchAllSchedules = async () => {
    loading.value = true
    clearError()
    try {
      const result = await CourseSchedulingApi.getAllSchedules()
      // Ensure result is an array before assigning
      if (Array.isArray(result)) {
        schedules.value = result
      } else {
        console.error('getAllSchedules returned non-array:', result)
        schedules.value = []
        setError('Invalid response format from server')
      }
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch schedules'
      setError(errorMessage)
      console.error('Error fetching schedules:', err)
      // Ensure schedules.value remains an array even on error
      schedules.value = []
    } finally {
      loading.value = false
    }
  }

  const createSchedule = async (name: string) => {
    loading.value = true
    clearError()
    
    // Validate inputs
    if (!currentUserId.value) {
      const errorMsg = 'No user ID available. Please ensure you are logged in.'
      setError(errorMsg)
      console.error('Create schedule error:', errorMsg)
      loading.value = false
      throw new Error(errorMsg)
    }
    
    if (!name || !name.trim()) {
      const errorMsg = 'Schedule name is required.'
      setError(errorMsg)
      console.error('Create schedule error:', errorMsg)
      loading.value = false
      throw new Error(errorMsg)
    }
    
    try {
      const requestData = {
        userId: currentUserId.value,
        name: name.trim()
      }
      
      console.log('Creating schedule with request data:', requestData)
      console.log('Current user ID type:', typeof currentUserId.value)
      console.log('Schedule name type:', typeof name)
      
      const response = await CourseSchedulingApi.createSchedule(requestData)
      console.log('Create schedule response:', response)
      
      // Ensure schedules.value is an array before pushing
      if (!Array.isArray(schedules.value)) {
        schedules.value = []
      }
      
      // Log owner comparison for debugging
      console.log('Schedule owner from response:', response.s.owner)
      console.log('Current user ID from store:', currentUserId.value)
      console.log('Owner matches:', response.s.owner === currentUserId.value)
      
      // Update user ID in auth store if it doesn't match (fallback if fetchUserIdFromSession didn't work)
      // This can happen if the user had no schedules when they authenticated
      if (response.s.owner && response.s.owner !== currentUserId.value) {
        console.log('Updating user ID from schedule owner (fallback):', response.s.owner)
        if (authStore.user) {
          authStore.user._id = response.s.owner
          // Update localStorage to persist the change
          localStorage.setItem('auth_user', JSON.stringify(authStore.user))
          
          // Also update session store if it has an empty userID
          if (sessionStore.currentSession && !sessionStore.currentSession.userID) {
            sessionStore.currentSession.userID = response.s.owner
          }
        }
      }
      
      schedules.value.push(response.s)
      
      // Log schedules after push
      console.log('Total schedules after push:', schedules.value.length)
      const updatedUserId = authStore.user?._id || currentUserId.value
      console.log('Updated user ID:', updatedUserId)
      console.log('User schedules after push:', schedules.value.filter(s => s.owner === updatedUserId).length)
      
      return response.s
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to create schedule'
      setError(errorMessage)
      console.error('Error creating schedule:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        userId: currentUserId.value,
        name: name
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    loading.value = true
    clearError()
    try {
      await CourseSchedulingApi.deleteSchedule({
        userId: currentUserId.value,
        scheduleId
      })
      // Ensure schedules.value is an array before filtering
      if (Array.isArray(schedules.value)) {
        schedules.value = schedules.value.filter(s => s.id !== scheduleId)
      } else {
        schedules.value = []
      }
      console.log(`Successfully deleted schedule: ${scheduleId}`)
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to delete schedule'
      setError(errorMessage)
      console.error('Error deleting schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const duplicateSchedule = async (sourceScheduleId: string, newName: string) => {
    loading.value = true
    clearError()
    try {
      const response = await CourseSchedulingApi.duplicateSchedule({
        userId: currentUserId.value,
        sourceScheduleId,
        newName
      })
      // Ensure schedules.value is an array before pushing
      if (!Array.isArray(schedules.value)) {
        schedules.value = []
      }
      schedules.value.push(response.s)
      return response.s
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to duplicate schedule'
      setError(errorMessage)
      console.error('Error duplicating schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const addSectionToSchedule = async (scheduleId: string, sectionId: string) => {
    loading.value = true
    clearError()
    try {
      await CourseSchedulingApi.addSection({
        userId: currentUserId.value,
        scheduleId,
        sectionId
      })
      // Update the schedule in our local state
      if (Array.isArray(schedules.value)) {
        const schedule = schedules.value.find(s => s.id === scheduleId)
        if (schedule && !schedule.sectionIds.includes(sectionId)) {
          schedule.sectionIds.push(sectionId)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to add section to schedule'
      setError(errorMessage)
      console.error('Error adding section to schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeSectionFromSchedule = async (scheduleId: string, sectionId: string) => {
    loading.value = true
    clearError()
    try {
      await CourseSchedulingApi.removeSection({
        userId: currentUserId.value,
        scheduleId,
        sectionId
      })
      // Update the schedule in our local state
      if (Array.isArray(schedules.value)) {
        const schedule = schedules.value.find(s => s.id === scheduleId)
        if (schedule) {
          schedule.sectionIds = schedule.sectionIds.filter(id => id !== sectionId)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to remove section from schedule'
      setError(errorMessage)
      console.error('Error removing section from schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getScheduleById = (scheduleId: string) => {
    if (!Array.isArray(schedules.value)) {
      return undefined
    }
    return schedules.value.find(schedule => schedule.id === scheduleId)
  }

  return {
    // State
    schedules,
    loading,
    error,
    currentUserId,
    // Getters
    scheduleCount,
    userSchedules,
    // Actions
    fetchAllSchedules,
    createSchedule,
    deleteSchedule,
    duplicateSchedule,
    addSectionToSchedule,
    removeSectionFromSchedule,
    getScheduleById,
    setError,
    clearError
  }
})
