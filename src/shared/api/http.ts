import { config } from '../../app/config'
import { useAuthStore } from '../../app/store'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

let getAuthHeaders: (() => Record<string, string>) | null = null

export function setAuthHeaderProvider(fn: () => Record<string, string>) {
  getAuthHeaders = fn
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, config.api.baseUrl || window.location.origin)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (getAuthHeaders) {
    Object.assign(headers, getAuthHeaders())
  }

  const response = await fetch(buildUrl(path, params), {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error ?? `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    apiRequest<T>(path, { params }),

  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
}
