// One place that knows how to call the API, attach the session token, and turn
// a failed response into something the forms can render.

import type {
  Account, Book, CatalogueQuery, FieldErrors, SessionResponse
} from './types'

const BASE = '/api'

/**
 * Every non-2xx response arrives as the same JSON shape from
 * ApiExceptionHandler, so the UI has exactly one error type to deal with.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let token: string | null = null

export function setToken(value: string | null): void {
  token = value
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    // fetch only rejects when the request never got an answer.
    throw new ApiError(0, 'Cannot reach the server. Is the Spring Boot API running?')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const body = (payload ?? {}) as { message?: string; fieldErrors?: FieldErrors }
    throw new ApiError(
      response.status,
      body.message ?? `Request failed (${response.status})`,
      body.fieldErrors ?? {}
    )
  }

  return payload as T
}

function queryString(query: CatalogueQuery): string {
  const params = new URLSearchParams()
  if (query.search?.trim()) params.set('search', query.search.trim())
  if (query.genre && query.genre !== 'All') params.set('genre', query.genre)
  if (query.maxPrice != null) params.set('maxPrice', String(query.maxPrice))
  if (query.inStockOnly) params.set('inStockOnly', 'true')
  if (query.sort) params.set('sort', query.sort)
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}

export const api = {
  books: (query: CatalogueQuery = {}) =>
    request<Book[]>(`/books${queryString(query)}`),

  genres: () => request<string[]>('/genres'),

  register: (fullName: string, email: string, password: string) =>
    request<SessionResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password })
    }),

  login: (email: string, password: string) =>
    request<SessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  me: () => request<Account>('/auth/me')
}
