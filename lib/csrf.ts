import { NextRequest } from 'next/server'

// CSRF protection by checking origin header
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // For same-origin requests, origin might be null
  if (!origin) {
    // Check if it's a same-origin request
    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        return refererUrl.host === host
      } catch {
        return false
      }
    }
    // Allow requests without origin/referer only for GET requests
    return request.method === 'GET'
  }

  // Validate origin matches host
  try {
    const originUrl = new URL(origin)
    return originUrl.host === host
  } catch {
    return false
  }
}

export function csrfProtection(request: NextRequest): Response | null {
  // Only check for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!validateOrigin(request)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request origin' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return null
}
