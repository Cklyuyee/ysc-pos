const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET'
  const isForm = init?.body instanceof FormData
  const headers = isForm
    ? init?.headers
    : { 'Content-Type': 'application/json', ...init?.headers }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch (err) {
    console.error(`[apiFetch] ${method} ${BASE}${path} — network error`, err)
    throw Object.assign(new Error('ไม่สามารถเชื่อมต่อ API ได้'), { status: 0, cause: err })
  }

  if (res.status === 401) {
    console.warn(`[apiFetch] ${method} ${path} — 401 Unauthorized`)
    if (!path.startsWith('/auth/') && !path.startsWith('/me')) {
      window.location.href = '/login'
    }
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`[apiFetch] ${method} ${path} — HTTP ${res.status}`, err)
    throw Object.assign(new Error(err.message ?? `HTTP ${res.status}`), { status: res.status, data: err })
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as T)
}
