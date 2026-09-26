'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { logToTerminal } from '@/lib/logger'

export default function NavigationLogger() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    const search = searchParams?.toString()
    const fullPath = search ? `${pathname}?${search}` : pathname

    if (lastPath.current !== fullPath) {
      lastPath.current = fullPath
      logToTerminal({
        type: 'PAGE_CHANGE',
        message: fullPath,
        details: {
          pathname,
          search: search || '(none)',
          timestamp: new Date().toISOString(),
        },
      })
    }
  }, [pathname, searchParams])

  return null
}
