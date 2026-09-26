import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { type, message, details, level = 'info' } = data
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })

    // ANSI escape codes for rich terminal styling
    const reset = '\x1b[0m'
    const bold = '\x1b[1m'
    const dim = '\x1b[2m'
    const cyan = '\x1b[36m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const red = '\x1b[31m'
    const magenta = '\x1b[35m'
    const blue = '\x1b[34m'

    if (type === 'PAGE_CHANGE') {
      console.log(`\n${bold}${cyan}🧭 [PAGE NAVIGATION] [${timestamp}]${reset} ➜ ${bold}${message}${reset}`)
      if (details) {
        console.log(`   ${dim}Route details: Path: ${details.pathname} | Query: ${details.search || 'none'}${reset}`)
      }
    } else if (type === 'API_CALL' || type === 'ACTION') {
      const isErr = level === 'error'
      const statusColor = isErr ? red : green
      console.log(`\n${bold}${magenta}⚡ [API / ACTION] [${timestamp}]${reset} ${bold}${message}${reset}`)
      if (details) {
        Object.entries(details).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            const formattedVal = typeof val === 'object' ? JSON.stringify(val) : String(val)
            const itemColor = key.toLowerCase().includes('result') || key.toLowerCase().includes('status') ? statusColor : blue
            console.log(`   • ${itemColor}${key}:${reset} ${formattedVal}`)
          }
        })
      }
    } else if (type === 'MESSAGE') {
      const isErr = level === 'error'
      const msgColor = isErr ? red : green
      const msgIcon = isErr ? '❌' : '💬'
      console.log(`\n${bold}${msgColor}${msgIcon} [SYSTEM MESSAGE] [${timestamp}]${reset} ${message}`)
      if (details) {
        console.log(`   ${dim}${JSON.stringify(details, null, 2)}${reset}`)
      }
    } else if (type === 'FILTER') {
      console.log(`\n${bold}${yellow}🔍 [FILTER / SEARCH] [${timestamp}]${reset} ${message}`)
      if (details) {
        console.log(`   ${dim}${JSON.stringify(details)}${reset}`)
      }
    } else {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, details || '')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
