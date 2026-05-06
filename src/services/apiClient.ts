const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData
  const headers = isForm
    ? init?.headers
    : { 'Content-Type': 'application/json', ...init?.headers }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
  if (res.status === 401) {
    if (!path.startsWith('/auth/') && !path.startsWith('/me')) {
      window.location.href = '/login'
    }
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), { status: res.status, data: err })
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as T)
}
