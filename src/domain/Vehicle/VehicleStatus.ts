export const VehicleStatus = {
  REALTIME: 'REALTIME',
  SCHEDULED: 'SCHEDULED',
} as const

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus]

export function getVehicleStatus(type: string | null): VehicleStatus {
  if (type === null || type === 'MESSAGE') return VehicleStatus.REALTIME
  return VehicleStatus.SCHEDULED
}
