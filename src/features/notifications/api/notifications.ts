import { api } from '../../../shared/api/http'
import { V1_BASE } from '../../../shared/constants'
import type { Notification } from '../../../domain/Notification/Notification'

export function subscribeNotification(data: { stopId: string; serviceId: string; minutesBefore: number }) {
  return api.post<Notification>(`${V1_BASE}/notifications/subscribe`, data)
}

export function getStopNotifications(stopId: string) {
  return api.get<Notification[]>(`${V1_BASE}/notifications/stop/${stopId}`)
}

export function deleteNotification(id: string) {
  return api.delete<void>(`${V1_BASE}/notifications/${id}`)
}
