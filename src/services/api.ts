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
  ApiError as ApiErrorType,
  // CourseFiltering types
  Tag,
  FilteredCourse,
  AddTagRequest,
  AddTagResponse,
  RemoveTagRequest,
  RemoveTagResponse,
  ClearTagsResponse,
  GetFilteredCoursesResponse,
  GetActiveTagsResponse,
  SuggestAlternativesRequest,
  SuggestAlternativesResponse,
  // UserAuth types
  User,
  RegisterRequest,
  RegisterResponse,
  ConfirmRequest,
  ConfirmResponse,
  AuthenticateRequest,
  AuthenticateResponse,
  // Session types
  Session,
  StartSessionRequest,
  StartSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
  UseSessionRequest,
  UseSessionResponse,
  ExtendSessionRequest,
  ExtendSessionResponse,
  ExpireSessionsResponse,
  // ProfessorRatings types
  ProfessorRating,
  GetRatingForSectionRequest,
  GetRatingForSectionResponse,
  RefreshRatingRequest,
  RefreshRatingResponse
} from '../types/api'

// Safe access without relying on Vite's ambient types
const API_BASE =
  ((import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) || '/api'

// Construct full API URLs using the base URL
const API_BASE_URL = `${API_BASE}/CourseScheduling`
const COURSE_FILTERING_BASE_URL = `${API_BASE}/CourseFiltering`
const USER_AUTH_BASE_URL = `${API_BASE}/UserAuth`
const SESSION_BASE_URL = `${API_BASE}/Session`
const PROFESSOR_RATINGS_BASE_URL = `${API_BASE}/ProfessorRatings`

class ApiServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiServiceError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL
): Promise<T> {
  const url = `${baseUrl}/${endpoint}`
  
  // Get session ID from localStorage if available
  const sessionId = localStorage.getItem('session_id')
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'X-Session-ID': sessionId } : {}),
    },
  }

  console.log(`Making API request to: ${url}`)
  
  // Check if this is an auth endpoint (don't log credentials)
  const isAuthEndpoint = url.includes('/UserAuth/') || url.includes('/Session/')
  
  // Sanitized: don't log request body as it may contain credentials
  const sanitizedOptions = { ...defaultOptions, ...options }
  if (sanitizedOptions.body && isAuthEndpoint) {
    sanitizedOptions.body = '[REDACTED]'
  }
  console.log(`Request options:`, sanitizedOptions)
  
  // Log request body for non-auth endpoints to help with debugging
  if (!isAuthEndpoint && options.body) {
    try {
      const bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
      console.log('Request body:', JSON.stringify(bodyObj, null, 2))
    } catch (e) {
      console.log('Request body (raw):', options.body)
    }
  }
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    console.log(`Response status: ${response.status} for ${url}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error for ${url}:`, errorText)
      console.error(`Response status: ${response.status}`)
      
      // Log request body for debugging non-auth endpoints
      if (!isAuthEndpoint && options.body) {
        try {
          const bodyObj = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
          console.error('Request body that caused error:', JSON.stringify(bodyObj, null, 2))
        } catch (e) {
          console.error('Request body (raw):', options.body)
        }
      }
      
      // Try to parse error response as JSON
      let errorDetails: { message?: string; error?: string } | null = null
      try {
        errorDetails = JSON.parse(errorText)
        console.error('Parsed error details:', errorDetails)
      } catch (e) {
        console.error('Could not parse error response as JSON:', e)
      }
      
      // Provide specific error messages based on status codes
      let errorMessage = ''
      switch (response.status) {
        case 400:
          errorMessage = errorDetails?.message || errorDetails?.error || 'Bad request. Please check your input data.'
          break
        case 401:
          errorMessage = 'Unauthorized access. Please check your credentials.'
          break
        case 404:
          errorMessage = 'Resource not found. The requested item may have been deleted.'
          break
        case 500:
          errorMessage = errorDetails?.message || errorDetails?.error || 'Internal server error. Please try again later.'
          break
        case 502:
          errorMessage = 'Server error. The backend service is temporarily unavailable. Please try again later.'
          break
        case 503:
          errorMessage = 'Service temporarily unavailable. The server is overloaded or under maintenance. Please try again later.'
          break
        case 504:
          errorMessage = errorDetails?.message || 'Request timed out. The server took too long to respond. Please try again later.'
          break
        default:
          errorMessage = `HTTP error! status: ${response.status} - ${errorDetails?.message || errorText}`
      }
      
      throw new ApiServiceError(errorMessage)
    }

    const data = await response.json()
    
    // Check if the response contains an error
    if (data && typeof data === 'object' && 'error' in data) {
      throw new ApiServiceError(data.error)
    }

    return data
  } catch (error) {
    if (error instanceof ApiServiceError) {
      throw error
    }
    console.error(`Network error for ${url}:`, error)
    throw new ApiServiceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
    console.log('Creating schedule with request:', request)
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

export class CourseFilteringApi {
  // Tag Management
  static async addTag(request: AddTagRequest): Promise<AddTagResponse> {
    return apiRequest<AddTagResponse>('addTag', {
      method: 'POST',
      body: JSON.stringify(request)
    }, COURSE_FILTERING_BASE_URL)
  }

  static async removeTag(request: RemoveTagRequest): Promise<RemoveTagResponse> {
    return apiRequest<RemoveTagResponse>('removeTag', {
      method: 'POST',
      body: JSON.stringify(request)
    }, COURSE_FILTERING_BASE_URL)
  }

  static async clearTags(): Promise<ClearTagsResponse> {
    return apiRequest<ClearTagsResponse>('clearTags', {
      method: 'POST',
      body: JSON.stringify({})
    }, COURSE_FILTERING_BASE_URL)
  }

  // Course Filtering
  static async getFilteredCourses(): Promise<FilteredCourse[]> {
    return apiRequest<FilteredCourse[]>('getFilteredCourses', {
      method: 'POST',
      body: JSON.stringify({})
    }, COURSE_FILTERING_BASE_URL)
  }

  static async getActiveTags(): Promise<Tag[]> {
    return apiRequest<Tag[]>('getActiveTags', {
      method: 'POST',
      body: JSON.stringify({})
    }, COURSE_FILTERING_BASE_URL)
  }

  static async suggestAlternatives(request: SuggestAlternativesRequest): Promise<FilteredCourse[]> {
    return apiRequest<FilteredCourse[]>('suggestAlternatives', {
      method: 'POST',
      body: JSON.stringify(request)
    }, COURSE_FILTERING_BASE_URL)
  }
}

export class UserAuthApi {
  // User Authentication
  static async register(request: RegisterRequest): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('register', {
      method: 'POST',
      body: JSON.stringify(request)
    }, USER_AUTH_BASE_URL)
  }

  static async confirm(request: ConfirmRequest): Promise<ConfirmResponse> {
    return apiRequest<ConfirmResponse>('confirm', {
      method: 'POST',
      body: JSON.stringify(request)
    }, USER_AUTH_BASE_URL)
  }

  static async authenticate(request: AuthenticateRequest): Promise<AuthenticateResponse> {
    return apiRequest<AuthenticateResponse>('authenticate', {
      method: 'POST',
      body: JSON.stringify(request)
    }, USER_AUTH_BASE_URL)
  }
}

export class SessionApi {
  // Session Management
  static async startSession(request: StartSessionRequest): Promise<StartSessionResponse> {
    return apiRequest<StartSessionResponse>('startSession', {
      method: 'POST',
      body: JSON.stringify(request)
    }, SESSION_BASE_URL)
  }

  static async endSession(request: EndSessionRequest): Promise<EndSessionResponse> {
    return apiRequest<EndSessionResponse>('endSession', {
      method: 'POST',
      body: JSON.stringify(request)
    }, SESSION_BASE_URL)
  }

  static async useSession(request: UseSessionRequest): Promise<UseSessionResponse> {
    return apiRequest<UseSessionResponse>('useSession', {
      method: 'POST',
      body: JSON.stringify(request)
    }, SESSION_BASE_URL)
  }

  static async extendSession(request: ExtendSessionRequest): Promise<ExtendSessionResponse> {
    return apiRequest<ExtendSessionResponse>('extendSession', {
      method: 'POST',
      body: JSON.stringify(request)
    }, SESSION_BASE_URL)
  }

  static async expireSessions(): Promise<ExpireSessionsResponse> {
    return apiRequest<ExpireSessionsResponse>('expireSessions', {
      method: 'POST',
      body: JSON.stringify({})
    }, SESSION_BASE_URL)
  }
}

export class ProfessorRatingsApi {
  // Professor Ratings Management
  static async getRatingForSection(request: GetRatingForSectionRequest): Promise<GetRatingForSectionResponse> {
    return apiRequest<GetRatingForSectionResponse>('getRatingForSection', {
      method: 'POST',
      body: JSON.stringify(request)
    }, PROFESSOR_RATINGS_BASE_URL)
  }

  static async refreshRating(request: RefreshRatingRequest): Promise<RefreshRatingResponse> {
    return apiRequest<RefreshRatingResponse>('refreshRating', {
      method: 'POST',
      body: JSON.stringify(request)
    }, PROFESSOR_RATINGS_BASE_URL)
  }

  static async getAllCachedRatings(): Promise<ProfessorRating[]> {
    return apiRequest<ProfessorRating[]>('getAllCachedRatings', {
      method: 'POST',
      body: JSON.stringify({})
    }, PROFESSOR_RATINGS_BASE_URL)
  }

  static async clearCache(): Promise<{ success: boolean; deletedCount: number }> {
    return apiRequest<{ success: boolean; deletedCount: number }>('clearCache', {
      method: 'POST',
      body: JSON.stringify({})
    }, PROFESSOR_RATINGS_BASE_URL)
  }
}

export { ApiServiceError }
