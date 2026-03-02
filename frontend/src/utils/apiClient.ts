// Centralized API client with request cancellation support
// Minimal surface: apiRequest(url, options?) and cancelAllRequests()

const activeControllers = new Set()

const withAbortController = () => {
  const controller = new AbortController()
  activeControllers.add(controller)
  const cleanup = () => activeControllers.delete(controller)
  return { controller, signal: controller.signal, cleanup }
}

const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

export const apiRequest = async (url, options = {}) => {
  const { signal, cleanup } = withAbortController()
  try {
    const headers = new Headers(options.headers || {})
    const token = getAuthToken()
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (
      !headers.has('Content-Type') &&
      options.body &&
      typeof options.body === 'object' &&
      !(options.body instanceof FormData)
    ) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await fetch(url, { ...options, headers, signal })
    return response
  } finally {
    cleanup()
  }
}

export const cancelAllRequests = () => {
  for (const controller of Array.from(activeControllers)) {
    try {
      controller.abort()
    } catch {
      /* no-op */
    }
    activeControllers.delete(controller)
  }
}
