// API Data Models
export interface Course {
  id: string
  title: string
  department: string
}

export interface TimeSlot {
  days: string[]
  startTime: string // HH:mm format
  endTime: string   // HH:mm format
  location: string
}

export interface Section {
  id: string
  courseId: string
  sectionNumber: string
  instructor: string
  capacity: number
  timeSlots: TimeSlot[]
}

export interface Schedule {
  id: string
  name: string
  sectionIds: string[]
  owner: string
}

// API Request/Response Types
export interface CreateCourseRequest {
  id: string
  title: string
  department: string
}

export interface CreateCourseResponse {
  c: Course
}

export interface CreateSectionRequest {
  courseId: string
  sectionNumber: string
  instructor: string
  capacity: number
  timeSlots: TimeSlot[]
}

export interface CreateSectionResponse {
  s: Section
}

export interface AddSectionRequest {
  userId: string
  scheduleId: string
  sectionId: string
}

export interface EditSectionRequest {
  sectionId: string
  updates: {
    sectionNumber?: string
    instructor?: string
    capacity?: number
    timeSlots?: TimeSlot[]
  }
}

export interface EditSectionResponse {
  s: Section
}

export interface RemoveSectionRequest {
  userId: string
  scheduleId: string
  sectionId: string
}

export interface CreateScheduleRequest {
  userId: string
  name: string
}

export interface CreateScheduleResponse {
  s: Schedule
}

export interface DeleteScheduleRequest {
  userId: string
  scheduleId: string
}

export interface DuplicateScheduleRequest {
  userId: string
  sourceScheduleId: string
  newName: string
}

export interface DuplicateScheduleResponse {
  s: Schedule
}

export interface GetCourseRequest {
  courseId: string
}

export interface GetSectionRequest {
  sectionId: string
}

export interface ApiError {
  error: string
}

// Generic API Response types
export type ApiResponse<T> = T | ApiError
export type QueryResponse<T> = T[] | ApiError

