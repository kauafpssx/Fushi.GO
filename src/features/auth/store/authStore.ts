import { create } from 'zustand'
import type { AuthSession } from '../types'
import { setAuthHeaderProvider } from '../../../shared/api/http'
import { config } from '../../../app/config'

interface AuthState {
  session: AuthSession | null
  isAuthenticated: boolean
  register: (deviceId: string) => Promise<void>
  refresh: () => Promise<void>
  logout: () => void
}

function generateDeviceId(): string {
  return crypto.randomUUID()
}

function getStoredDeviceId(): string {
  return localStorage.getItem('deviceId') ?? generateDeviceId()
}

function storeDeviceId(id: string): void {
  localStorage.setItem('deviceId', id)
}

function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem('auth')
  if (!raw) return null
  try { return JSON.parse(raw) as AuthSession } catch { return null }
}

function storeSession(session: AuthSession): void {
  localStorage.setItem('auth', JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem('auth')
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialSession = getStoredSession()
  const deviceId = getStoredDeviceId()
  storeDeviceId(deviceId)

  if (initialSession) {
    initialSession.deviceId = deviceId
  }

  setAuthHeaderProvider(() => {
    const s = get().session
    if (!s) return {} as Record<string, string>
    return {
      Authorization: `Bearer ${s.accessToken}`,
      'X-Device-Id': s.deviceId,
    }
  })

  return {
    session: initialSession,
    isAuthenticated: !!initialSession,

    register: async (deviceId: string) => {
      storeDeviceId(deviceId)

      const res = await fetch(`${config.api.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      if (!res.ok) throw new Error('Falha ao registrar')

      const data = await res.json()
      const session: AuthSession = { ...data, deviceId }

      storeSession(session)
      set({ session, isAuthenticated: true })
    },

    refresh: async () => {
      const s = get().session
      if (!s) return

      const res = await fetch(`${config.api.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-Device-Id': s.deviceId,
        },
      })

      if (!res.ok) {
        get().logout()
        return
      }

      const data = await res.json()
      const session: AuthSession = { ...data, deviceId: s.deviceId }
      storeSession(session)
      set({ session, isAuthenticated: true })
    },

    logout: () => {
      clearSession()
      set({ session: null, isAuthenticated: false })
    },
  }
})
