import { NextResponse } from 'next/server'

export async function GET() {
  // Return the Chrome DevTools configuration
  // This endpoint is used by Chrome DevTools for debugging
  return NextResponse.json({
    // Standard Chrome DevTools configuration
    browser: 'Chrome',
    'Browser-Version': '1.0',
    'Debug-Frontend-URL': 'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=',
    'DevTools-Frontend-URL': 'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=',
    id: 'surcor-app',
    title: 'Surcor Application',
    type: 'node',
    url: 'file://',
    webSocketDebuggerUrl: 'ws://localhost:3000/debug'
  })
} 