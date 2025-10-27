// API Data Models
export interface Course {
  id: string
  title: string
  department: string
  distribution?: string
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
  distribution?: string
}

export interface Schedule {
  id: string
  name: string
  sectionIds: string[]
  owner: string
}

// CourseFiltering Models
export interface Tag {
  id: string
  category: string
}

export interface FilteredCourse {
  course_code: string
  section: string
  title: string
  professor: string
  meeting_time: string
  current_enrollment: number
  seats_available: number
  seats_total: number
  distribution: string
  tags: Tag[]
}

// UserAuth Models
export interface User {
  _id: string
  email: string
  username: string
  confirmed: boolean
}

// Session Models
export interface Session {
  _id: string
  userID: string
  expiryTime: string
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
  distribution?: string
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
    distribution?: string
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

// CourseFiltering Request/Response Types
export interface AddTagRequest {
  id: string
  category: string
}

export interface RemoveTagRequest {
  id: string
  category: string
}

export interface AddTagResponse {
  success: boolean
}

export interface RemoveTagResponse {
  success: boolean
}

export interface ClearTagsResponse {
  success: boolean
}

export interface GetFilteredCoursesResponse {
  courses: FilteredCourse[]
}

export interface GetActiveTagsResponse {
  tags: Tag[]
}

export interface SuggestAlternativesRequest {
  course: FilteredCourse
  variant: 'base' | 'timeFocused' | 'topicFocused'
}

export interface SuggestAlternativesResponse {
  alternatives: FilteredCourse[]
}

// UserAuth Request/Response Types
export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface RegisterResponse {
  user: string
  token: string
}

export interface ConfirmRequest {
  username: string
  token: string
}

export interface ConfirmResponse {
  success: boolean
}

export interface AuthenticateRequest {
  username: string
  password: string
}

export interface AuthenticateResponse {
  user: string
}

// Session Request/Response Types
export interface StartSessionRequest {
  u: string
}

export interface StartSessionResponse {
  session: string
}

export interface EndSessionRequest {
  s: string
}

export interface EndSessionResponse {
  success: boolean
}

export interface UseSessionRequest {
  s: string
}

export interface UseSessionResponse {
  success: boolean
}

export interface ExtendSessionRequest {
  s: string
}

export interface ExtendSessionResponse {
  session: string
}

export interface ExpireSessionsResponse {
  success: boolean
}

// ProfessorRatings Models
export interface ProfessorRating {
  instructorName: string
  schoolName: string
  rating: number | null
  difficulty: number | null
  numRatings: number
  wouldTakeAgainPercent: number | null
  rmpId: string
  lastUpdated: string
}

// ProfessorRatings Request/Response Types
export interface GetRatingForSectionRequest {
  sectionId: string
}

export interface GetRatingForSectionResponse {
  success: boolean
  data?: ProfessorRating
  message?: string
}

export interface RefreshRatingRequest {
  instructorName: string
}

export interface RefreshRatingResponse {
  success: boolean
  data?: ProfessorRating
  message?: string
}

// Generic API Response types
export type ApiResponse<T> = T | ApiError
export type QueryResponse<T> = T[] | ApiError

