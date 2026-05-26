import { apiFetch } from './apiClient'

export interface MeResponse {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
}

export const signIn = (email: string, password: string) =>
  apiFetch<{ token?: string }>('/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const signOut = () =>
  apiFetch<void>('/auth/sign-out', { method: 'POST' })

export const getMe = () => apiFetch<MeResponse>('/me/permissions')

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiFetch<void>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

export const forgotPassword = (email: string, redirectTo?: string) =>
  apiFetch<void>('/auth/forget-password', {
    method: 'POST',
    body: JSON.stringify({ email, redirectTo: redirectTo ?? `${window.location.origin}/reset-password` }),
  })
