import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course } from '../types/api'
import { CourseSchedulingApi, ApiServiceError } from '../services/api'

export const useCourseStore = defineStore('course', () => {
  // State
  const courses = ref<Course[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const courseCount = computed(() => courses.value.length)
  const coursesByDepartment = computed(() => {
    const grouped = courses.value.reduce((acc, course) => {
      if (!acc[course.department]) {
        acc[course.department] = []
      }
      acc[course.department].push(course)
      return acc
    }, {} as Record<string, Course[]>)
    return grouped
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const fetchAllCourses = async () => {
    loading.value = true
    clearError()
    try {
      courses.value = await CourseSchedulingApi.getAllCourses()
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch courses'
      setError(errorMessage)
      console.error('Error fetching courses:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchCourse = async (courseId: string) => {
    loading.value = true
    clearError()
    try {
      const result = await CourseSchedulingApi.getCourse({ courseId })
      return result[0] || null
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to fetch course'
      setError(errorMessage)
      console.error('Error fetching course:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createCourse = async (courseData: { id: string; title: string; department: string }) => {
    loading.value = true
    clearError()
    try {
      const response = await CourseSchedulingApi.createCourse(courseData)
      courses.value.push(response.c)
      return response.c
    } catch (err) {
      const errorMessage = err instanceof ApiServiceError ? err.message : 'Failed to create course'
      setError(errorMessage)
      console.error('Error creating course:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCourseById = (courseId: string) => {
    return courses.value.find(course => course.id === courseId)
  }

  const getCoursesByDepartment = (department: string) => {
    return courses.value.filter(course => course.department === department)
  }

  return {
    // State
    courses,
    loading,
    error,
    // Getters
    courseCount,
    coursesByDepartment,
    // Actions
    fetchAllCourses,
    fetchCourse,
    createCourse,
    getCourseById,
    getCoursesByDepartment,
    setError,
    clearError
  }
})
