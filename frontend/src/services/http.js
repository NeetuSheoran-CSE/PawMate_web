/**
 * Tiny fetch wrapper used by httpApi.js.
 * - Adds the login token to every request
 * - Turns error responses into an ApiError with a friendly message
 */
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'pawmate_token_v1'

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const tokenStore = {
  get() { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set(token) { try { localStorage.setItem(TOKEN_KEY, token) } catch { /* private mode */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

function withQuery(path, query) {
  if (!query) return path
  const qs = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false || v === 0) return
    qs.set(k, v === true ? '1' : String(v))
  })
  const s = qs.toString()
  return s ? `${path}?${s}` : path
}

/** request('POST', '/pets', { body }) -> parsed JSON (or null for 204) */
export async function request(method, path, { query, body, form } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(BASE + withQuery(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError('Cannot reach the PawMate server. Check your connection and try again.')
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    // an expired or invalid token: sign the person out everywhere in the app
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      tokenStore.clear()
      window.dispatchEvent(new Event('pawmate:logout'))
    }
    throw new ApiError(data?.error?.message || `Something went wrong (${res.status}). Please try again.`, res.status)
  }
  return data
}
