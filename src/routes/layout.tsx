import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../app/store'
import { BottomNav } from '../components/BottomNav/BottomNav'

export function Layout() {
  const { register, session } = useAuthStore()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    register(crypto.randomUUID())
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(true))
  }, [register])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      useAuthStore.getState().refresh()
    }, 15 * 60_000)
    return () => clearInterval(interval)
  }, [session])

  if (!authReady) return null

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
