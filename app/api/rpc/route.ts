import { NextResponse } from 'next/server'
import { RPC_URL } from '@/lib/constants/chains'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // Max requests per window
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Helper to check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(ip)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userRequests.count >= MAX_REQUESTS) {
    return false
  }

  userRequests.count++
  return true
}

// Helper to get client IP
function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
}

export async function POST(request: Request) {
  const clientIP = getClientIP(request)

  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    
    // Log request for debugging
    console.log('RPC Request:', {
      method: body.method,
      params: body.params,
      clientIP
    })

    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Log response for debugging
    console.log('RPC Response:', {
      method: body.method,
      success: !data.error,
      clientIP
    })

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    // Log error
    console.error('RPC Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP
    })

    return NextResponse.json(
      { 
        error: 'RPC request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 