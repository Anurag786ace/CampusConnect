export type LogType = 'PAGE_CHANGE' | 'API_CALL' | 'ACTION' | 'MESSAGE' | 'FILTER'

export interface LogPayload {
  type: LogType
  message: string
  details?: Record<string, any>
  level?: 'info' | 'warn' | 'error'
}

export function logToTerminal(payload: LogPayload) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })

  if (typeof window !== 'undefined') {
    // Browser console output with styling
    const color =
      payload.type === 'PAGE_CHANGE'
        ? '#0284c7'
        : payload.type === 'API_CALL' || payload.type === 'ACTION'
          ? '#9333ea'
          : payload.level === 'error'
            ? '#dc2626'
            : '#16a34a'

    console.log(
      `%c[${payload.type}] ${payload.message}`,
      `color: ${color}; font-weight: bold;`,
      payload.details || '',
    )

    // Send payload to Next.js server endpoint to output in terminal
    try {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently catch fetch errors (e.g., during fast refresh / offline)
      })
    } catch {
      // Ignore
    }
  } else {
    // Server console output directly to terminal
    console.log(`[${timestamp}] [${payload.type}] ${payload.message}`, payload.details || '')
  }
}
