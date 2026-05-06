import { apiFetch } from './apiClient'

export interface ApiBankAccount {
  id: string
  bankCode: string
  bankName: string
  accountName: string
  accountNumber: string
  branchName?: string
  allowedDocTypes?: string[]
  isActive?: boolean
}

export const getBankAccounts = (docType?: string) => {
  const qs = docType ? `?docType=${encodeURIComponent(docType)}` : ''
  return apiFetch<ApiBankAccount[]>(`/config/banks${qs}`)
}
