import { apiFetch } from './apiClient'

export interface MeResponse {
  id: string
  name: string
  email: string
  role: string
}

export const signIn = (email: string, password: string) =>
  apiFetch<{ token?: string }>('/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const signOut = () =>
  apiFetch<void>('/auth/sign-out', { method: 'POST' })

export const getMe = () => apiFetch<MeResponse>('/me')
