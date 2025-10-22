import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Section } from '../types/api'
import { CourseSchedulingApi, ApiServiceError } from '../services/api'

export const useSectionStore = defineStore('section', () => {
  // State
  const sections = ref<Section[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sectionCount = computed(() => sections.value.length)
  const sectionsByCourse = computed(() => {
    const grouped = sections.value.reduce((acc, section) => {
      if (!acc[section.courseId]) {
        acc[section.courseId] = []
      }
      acc[section.courseId].push(section)
      return acc
    }, {} as Record<string, Section[]>)
    return grouped
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const fetchAllSections = async () => {
    loading.value = true
    clearError()
    try {
      sections.value = await CourseSchedulingApi.getAllSections()
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch sections'
      setError(errorMessage)
      console.error('Error fetching sections:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchSection = async (sectionId: string) => {
    loading.value = true
    clearError()
    try {
      const result = await CourseSchedulingApi.getSection({ sectionId })
      return result[0] || null
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch section'
      setError(errorMessage)
      console.error('Error fetching section:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createSection = async (sectionData: {
    courseId: string
    sectionNumber: string
    instructor: string
    capacity: number
    timeSlots: Array<{
      days: string[]
      startTime: string
      endTime: string
      location: string
    }>
  }) => {
    loading.value = true
    clearError()
    try {
      const response = await CourseSchedulingApi.createSection(sectionData)
      sections.value.push(response.s)
      return response.s
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to create section'
      setError(errorMessage)
      console.error('Error creating section:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const editSection = async (sectionId: string, updates: {
    sectionNumber?: string
    instructor?: string
    capacity?: number
    timeSlots?: Array<{
      days: string[]
      startTime: string
      endTime: string
      location: string
    }>
  }) => {
    loading.value = true
    clearError()
    try {
      const response = await CourseSchedulingApi.editSection({ sectionId, updates })
      const index = sections.value.findIndex(s => s.id === sectionId)
      if (index !== -1) {
        sections.value[index] = response.s
      }
      return response.s
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to edit section'
      setError(errorMessage)
      console.error('Error editing section:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getSectionById = (sectionId: string) => {
    return sections.value.find(section => section.id === sectionId)
  }

  const getSectionsByCourse = (courseId: string) => {
    return sections.value.filter(section => section.courseId === courseId)
  }

  return {
    // State
    sections,
    loading,
    error,
    // Getters
    sectionCount,
    sectionsByCourse,
    // Actions
    fetchAllSections,
    fetchSection,
    createSection,
    editSection,
    getSectionById,
    getSectionsByCourse,
    setError,
    clearError
  }
})
