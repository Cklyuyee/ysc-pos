const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), { status: res.status, data: err })
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as T)
}
