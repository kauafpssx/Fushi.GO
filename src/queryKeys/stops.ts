export const stopKeys = {
  all: ['stops'] as const,
  service: (id: string) => ['stops', 'service', id] as const,
  predictions: (id: string) => ['predictions', 'stop', id] as const,
}
