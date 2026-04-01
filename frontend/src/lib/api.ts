const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'buyer_portal_token'
let memoryToken: string | null = null

export type ApiError = {
  detail?: string
  message: string
  status: number
}

export type User = {
  id: number
  name: string
  email: string
  phone_number: string
  role: 'buyer' | 'seller'
}

export type Property = {
  id: number
  name: string
  description: string | null
  location: string
  price: number
  created_by_id: number
  created_at: string
}

export type Favourite = {
  id: number
  property_id: number
  created_at: string
}

export function getToken(): string | null {
  if (memoryToken) {
    return memoryToken
  }

  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      return token
    }
  } catch {
    // Ignore storage availability issues.
  }

  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) {
      return token
    }
  } catch {
    // Ignore storage availability issues.
  }

  return null
}

export function setToken(token: string): void {
  memoryToken = token

  try {
    localStorage.setItem(TOKEN_KEY, token)
    return
  } catch {
    // Fall back when localStorage is full or blocked by browser settings.
  }

  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Keep in-memory fallback only for this tab session.
  }
}

export function clearToken(): void {
  memoryToken = null

  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage availability issues.
  }

  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage availability issues.
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const errorBody = (await response.json()) as { detail?: string; message?: string }
      message = errorBody.detail ?? errorBody.message ?? message
    } catch {
      message = response.statusText || message
    }

    const error: ApiError = {
      message,
      detail: message,
      status: response.status,
    }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function register(payload: {
  name: string
  email: string
  phone_number: string
  role: 'buyer' | 'seller'
  password: string
}) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(payload: { email: string; password: string }) {
  const result = await request<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(result.access_token)
  return result
}

export function getMe() {
  return request<User>('/auth/me')
}

export function listProperties() {
  return request<Property[]>('/properties')
}

export function createProperty(payload: {
  name: string
  description?: string
  location: string
  price: number
}) {
  return request<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFavourites() {
  return request<Favourite[]>('/favourites')
}

export function listFavouriteProperties() {
  return request<Property[]>('/favourites/properties')
}

export function addFavourite(propertyId: number) {
  return request<Favourite>(`/favourites/${propertyId}`, { method: 'POST' })
}

export function removeFavourite(propertyId: number) {
  return request<void>(`/favourites/${propertyId}`, { method: 'DELETE' })
}
