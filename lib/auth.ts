/**
 * Unified identity resolution function
 * Single source of truth for user identity across the app
 * 
 * @param authUserId - The authenticated user ID from auth store (null if not authenticated)
 * @returns The active user ID (authenticated user ID or anonymous ID)
 */
export function getActiveUserId(authUserId: string | null = null): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (shouldn't be used)
    return 'server'
  }

  // If authenticated, use auth user ID
  if (authUserId) {
    return authUserId
  }

  // Otherwise, use or create anonymous ID
  let anonymousId = localStorage.getItem('notely_anonymous_id')
  
  if (!anonymousId) {
    anonymousId = `anon_${crypto.randomUUID()}`
    localStorage.setItem('notely_anonymous_id', anonymousId)
  }
  
  return anonymousId
}

/**
 * Initialize anonymous user ID on first visit
 */
export function initializeAnonymousUser(): string {
  if (typeof window === 'undefined') {
    return `anon_${Date.now()}_${Math.random()}`
  }

  let anonymousId = localStorage.getItem('notely_anonymous_id')
  
  if (!anonymousId) {
    anonymousId = `anon_${crypto.randomUUID()}`
    localStorage.setItem('notely_anonymous_id', anonymousId)
  }
  
  return anonymousId
}

