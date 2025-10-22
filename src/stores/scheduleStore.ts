import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Schedule } from '../types/api'
import { CourseSchedulingApi, ApiServiceError } from '../services/api'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<string>('user-1') // Default user ID for demo

  // Getters
  const scheduleCount = computed(() => schedules.value.length)
  const userSchedules = computed(() => {
    return schedules.value.filter(schedule => schedule.owner === currentUserId.value)
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const setCurrentUserId = (userId: string) => {
    currentUserId.value = userId
  }

  const fetchAllSchedules = async () => {
    loading.value = true
    clearError()
    try {
      schedules.value = await CourseSchedulingApi.getAllSchedules()
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch schedules'
      setError(errorMessage)
      console.error('Error fetching schedules:', err)
    } finally {
      loading.value = false
    }
  }

  const createSchedule = async (name: string) => {
    loading.value = true
    clearError()
    try {
      const response = await CourseSchedulingApi.createSchedule({
        userId: currentUserId.value,
        name
      })
      schedules.value.push(response.s)
      return response.s
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to create schedule'
      setError(errorMessage)
      console.error('Error creating schedule:', err)
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
      schedules.value = schedules.value.filter(s => s.id !== scheduleId)
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
      const schedule = schedules.value.find(s => s.id === scheduleId)
      if (schedule && !schedule.sectionIds.includes(sectionId)) {
        schedule.sectionIds.push(sectionId)
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
      const schedule = schedules.value.find(s => s.id === scheduleId)
      if (schedule) {
        schedule.sectionIds = schedule.sectionIds.filter(id => id !== sectionId)
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
    setCurrentUserId,
    setError,
    clearError
  }
})
