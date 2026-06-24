type EventHandler = (data: unknown) => void

interface Connection {
  eventSource: EventSource
  handlers: Map<string, Set<EventHandler>>
}

export class SSEManager {
  private static connections = new Map<string, Connection>()

  static connect(url: string): void {
    if (this.connections.has(url)) return

    const es = new EventSource(url)
    const handlers = new Map<string, Set<EventHandler>>()

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const h = handlers.get('message')
        if (h) h.forEach((fn) => fn(data))
      } catch {}
    }

    es.onerror = () => {
      this.disconnect(url)
    }

    this.connections.set(url, { eventSource: es, handlers })
  }

  static on(url: string, event: string, handler: EventHandler): () => void {
    const conn = this.connections.get(url)
    if (!conn) {
      this.connect(url)
      return this.on(url, event, handler)
    }

    if (!conn.handlers.has(event)) {
      conn.handlers.set(event, new Set())
    }

    conn.handlers.get(event)!.add(handler)

    return () => {
      conn.handlers.get(event)?.delete(handler)
    }
  }

  static disconnect(url: string): void {
    const conn = this.connections.get(url)
    if (!conn) return
    conn.eventSource.close()
    this.connections.delete(url)
  }

  static disconnectAll(): void {
    for (const [url] of this.connections) {
      this.disconnect(url)
    }
  }
}
