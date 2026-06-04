// Envelope for all /api/v1/* responses
export interface ApiResponse<T> {
  data:   T
  error?: { code: string; message: string; detail?: string }
}

// Paginated list wrapper
export interface PaginatedResponse<T> {
  items:   T[]
  total:   number
  page:    number
  per_page: number
}
