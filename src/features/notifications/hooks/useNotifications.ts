import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscribeNotification, getStopNotifications, deleteNotification } from '../api/notifications'

export function useStopNotifications(stopId: string) {
  return useQuery({
    queryKey: ['notifications', stopId],
    queryFn: () => getStopNotifications(stopId),
    enabled: !!stopId,
  })
}

export function useSubscribeNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: subscribeNotification,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['notifications', vars.stopId] })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
