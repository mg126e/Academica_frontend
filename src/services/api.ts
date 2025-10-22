import type {
  Course,
  Section,
  Schedule,
  CreateCourseRequest,
  CreateCourseResponse,
  CreateSectionRequest,
  CreateSectionResponse,
  AddSectionRequest,
  EditSectionRequest,
  EditSectionResponse,
  RemoveSectionRequest,
  CreateScheduleRequest,
  CreateScheduleResponse,
  DeleteScheduleRequest,
  DuplicateScheduleRequest,
  DuplicateScheduleResponse,
  GetCourseRequest,
  GetSectionRequest,
  ApiError as ApiErrorType
} from '../types/api'

const API_BASE_URL = 'http://localhost:8000/CourseScheduling'

class ApiServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiServiceError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })
  
  if (!response.ok) {
    throw new ApiServiceError(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  
  // Check if the response contains an error
  if ('error' in data) {
    throw new ApiServiceError(data.error)
  }

  return data
}

export class CourseSchedulingApi {
  // Course Management
  static async createCourse(request: CreateCourseRequest): Promise<CreateCourseResponse> {
    return apiRequest<CreateCourseResponse>('createCourse', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async getCourse(request: GetCourseRequest): Promise<Course[]> {
    return apiRequest<Course[]>('getCourse', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async getAllCourses(): Promise<Course[]> {
    return apiRequest<Course[]>('getAllCourses', {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  // Section Management
  static async createSection(request: CreateSectionRequest): Promise<CreateSectionResponse> {
    return apiRequest<CreateSectionResponse>('createSection', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async getSection(request: GetSectionRequest): Promise<Section[]> {
    return apiRequest<Section[]>('getSection', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async getAllSections(): Promise<Section[]> {
    return apiRequest<Section[]>('getAllSections', {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  static async editSection(request: EditSectionRequest): Promise<EditSectionResponse> {
    return apiRequest<EditSectionResponse>('editSection', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Schedule Management
  static async createSchedule(request: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    return apiRequest<CreateScheduleResponse>('createSchedule', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async getAllSchedules(): Promise<Schedule[]> {
    return apiRequest<Schedule[]>('getAllSchedules', {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  static async deleteSchedule(request: DeleteScheduleRequest): Promise<void> {
    return apiRequest<void>('deleteSchedule', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async duplicateSchedule(request: DuplicateScheduleRequest): Promise<DuplicateScheduleResponse> {
    return apiRequest<DuplicateScheduleResponse>('duplicateSchedule', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Schedule-Section Operations
  static async addSection(request: AddSectionRequest): Promise<void> {
    return apiRequest<void>('addSection', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static async removeSection(request: RemoveSectionRequest): Promise<void> {
    return apiRequest<void>('removeSection', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }
}

export { ApiServiceError }
