import type { ApiResponse } from '../types'

export const API_BASE = '/api/v1'

export class ApiClientError extends Error {
  code:    string
  status:  number
  detail?: string

  constructor(code: string, message: string, status: number, detail?: string) {
    super(message)
    this.name   = 'ApiClientError'
    this.code   = code
    this.status = status
    this.detail = detail
  }
}

export async function apiFetch<T>(
  path:  string,
  init?: RequestInit,
): Promise<T> {
  let lastErr: ApiClientError | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await _apiFetchOnce<T>(path, init)
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'parse_error') {
        lastErr = err
        await new Promise(r => setTimeout(r, 150 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw lastErr!
}

async function _apiFetchOnce<T>(
  path:  string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  let payload: ApiResponse<T>
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    const hint = ct.includes('text/html')
      ? ' (received HTML — MSW Service Worker may not be intercepting requests yet)'
      : ''
    throw new ApiClientError(
      'parse_error',
      `Expected JSON but got [${res.status} ${ct || 'no content-type'}]${hint}`,
      res.status,
    )
  }
  try {
    payload = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiClientError(
      'parse_error',
      `Invalid JSON response [${res.status} ${ct}]`,
      res.status,
    )
  }

  if (!res.ok || payload.error) {
    const { code, message, detail } = payload.error ?? {
      code: 'unknown', message: 'Unknown error', detail: undefined,
    }
    throw new ApiClientError(code, message, res.status, detail)
  }

  return payload.data as T
}
