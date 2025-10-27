import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag, FilteredCourse, AddTagRequest, RemoveTagRequest, SuggestAlternativesRequest } from '../types/api'
import { CourseFilteringApi, ApiServiceError } from '../services/api'

export const useFilteringStore = defineStore('filtering', () => {
  // State
  const filteredCourses = ref<FilteredCourse[]>([])
  const activeTags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const filteredCourseCount = computed(() => filteredCourses.value.length)
  const activeTagCount = computed(() => activeTags.value.length)
  const coursesByTag = computed(() => {
    const grouped = filteredCourses.value.reduce((acc, course) => {
      course.tags.forEach(tag => {
        if (!acc[tag.id]) {
          acc[tag.id] = []
        }
        acc[tag.id].push(course)
      })
      return acc
    }, {} as Record<string, FilteredCourse[]>)
    return grouped
  })

  const availableTags = computed(() => {
    const allTags = new Set<string>()
    filteredCourses.value.forEach(course => {
      course.tags.forEach(tag => {
        allTags.add(tag.id)
      })
    })
    return Array.from(allTags).map(id => {
      const tag = filteredCourses.value
        .flatMap(course => course.tags)
        .find(t => t.id === id)
      return tag || { id, category: 'unknown' }
    })
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const fetchFilteredCourses = async () => {
    loading.value = true
    clearError()
    try {
      filteredCourses.value = await CourseFilteringApi.getFilteredCourses()
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch filtered courses'
      setError(errorMessage)
      // Silently fail - this is optional data
      // console.error('Error fetching filtered courses:', err)
      throw err // Re-throw so caller can handle
    } finally {
      loading.value = false
    }
  }

  const fetchActiveTags = async () => {
    loading.value = true
    clearError()
    try {
      activeTags.value = await CourseFilteringApi.getActiveTags()
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch active tags'
      setError(errorMessage)
      // Silently fail - this is optional data
      // console.error('Error fetching active tags:', err)
      throw err // Re-throw so caller can handle
    } finally {
      loading.value = false
    }
  }

  const addTag = async (tagId: string, category: string) => {
    loading.value = true
    clearError()
    try {
      const request: AddTagRequest = { id: tagId, category }
      const response = await CourseFilteringApi.addTag(request)
      if (response.success) {
        // Refresh the filtered courses and active tags
        await Promise.all([
          fetchFilteredCourses(),
          fetchActiveTags()
        ])
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to add tag'
      setError(errorMessage)
      console.error('Error adding tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeTag = async (tagId: string, category: string) => {
    loading.value = true
    clearError()
    try {
      const request: RemoveTagRequest = { id: tagId, category }
      const response = await CourseFilteringApi.removeTag(request)
      if (response.success) {
        // Refresh the filtered courses and active tags
        await Promise.all([
          fetchFilteredCourses(),
          fetchActiveTags()
        ])
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to remove tag'
      setError(errorMessage)
      console.error('Error removing tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearTags = async () => {
    loading.value = true
    clearError()
    try {
      const response = await CourseFilteringApi.clearTags()
      if (response.success) {
        // Refresh the filtered courses and active tags
        await Promise.all([
          fetchFilteredCourses(),
          fetchActiveTags()
        ])
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to clear tags'
      setError(errorMessage)
      console.error('Error clearing tags:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const suggestAlternatives = async (course: FilteredCourse, variant: 'base' | 'timeFocused' | 'topicFocused' = 'base') => {
    loading.value = true
    clearError()
    try {
      const request: SuggestAlternativesRequest = { course, variant }
      const alternatives = await CourseFilteringApi.suggestAlternatives(request)
      return alternatives
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to get alternative suggestions'
      setError(errorMessage)
      console.error('Error getting alternative suggestions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCoursesByTag = (tagId: string) => {
    return filteredCourses.value.filter(course => 
      course.tags.some(tag => tag.id === tagId)
    )
  }

  const getCoursesByCategory = (category: string) => {
    return filteredCourses.value.filter(course => 
      course.tags.some(tag => tag.category === category)
    )
  }

  const searchCourses = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return filteredCourses.value.filter(course => 
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.course_code.toLowerCase().includes(lowercaseQuery) ||
      course.professor.toLowerCase().includes(lowercaseQuery)
    )
  }

  const clearFilteringError = () => {
    clearError()
  }

  return {
    // State
    filteredCourses,
    activeTags,
    loading,
    error,
    // Getters
    filteredCourseCount,
    activeTagCount,
    coursesByTag,
    availableTags,
    // Actions
    fetchFilteredCourses,
    fetchActiveTags,
    addTag,
    removeTag,
    clearTags,
    suggestAlternatives,
    getCoursesByTag,
    getCoursesByCategory,
    searchCourses,
    setError,
    clearError,
    clearFilteringError
  }
})


