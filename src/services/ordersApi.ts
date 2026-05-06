import { apiFetch } from './apiClient'

export interface ApiOrderItem {
  sku: string
  productName: string
  qty: number
  unitPrice: string
  brand?: string
  category?: string
  isFreeItem?: boolean
}

export interface ApiOrder {
  id: string
  orderNumber: string
  channel: string
  orderStatus: string
  paymentMethod: string
  paymentStatus?: string
  deliveryStatus?: string
  customerId: string | null
  customerName?: string
  subtotal: string
  total: string
  items: ApiOrderItem[]
  createdAt: string
  confirmedAt?: string
  deliveredAt?: string
  [key: string]: unknown
}

export const getOrder = (orderId: string) =>
  apiFetch<ApiOrder>(`/orders/${orderId}`)

export interface ApiSlip {
  id: string
  orderId: string
  fileUrl?: string
  amount?: number
  bankAccountId?: string
  status?: string
  createdAt: string
}

export const uploadSlip = (orderId: string, file: File, opts?: {
  bankAccountId?: string
  amount?: number
  transferredAt?: string
}) => {
  const fd = new FormData()
  fd.append('file', file)
  if (opts?.bankAccountId) fd.append('bankAccountId', opts.bankAccountId)
  if (opts?.amount !== undefined) fd.append('amount', String(opts.amount))
  if (opts?.transferredAt) fd.append('transferredAt', opts.transferredAt)
  return apiFetch<ApiSlip>(`/orders/${orderId}/slips`, {
    method: 'POST',
    body: fd,
  })
}
