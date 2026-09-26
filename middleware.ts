import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })

  // Log page navigation request in terminal
  console.log(`\x1b[36m[${timestamp}] 🌐 [HTTP REQUEST]\x1b[0m ${request.method} ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - api/log (to avoid log loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/log).*)',
  ],
}
