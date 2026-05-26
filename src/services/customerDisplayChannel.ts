/**
 * BroadcastChannel contract between POSScreen (sender) and CustomerDisplayScreen (receiver).
 * Both windows must be same origin. Open /display in a second tab/window on the customer monitor.
 */

export const DISPLAY_CHANNEL = 'ysc-pos-customer-display'

export interface DisplayCartItem {
  sku: string
  name: string
  image?: string
  unit: string
  qty: number
  unitPrice: number
  lineTotal: number
  /** Discount applied to this line (0 if none) */
  lineDiscount?: number
  /** Promo tag labels shown under product name e.g. ["ซื้อ 1 แถม 1", "ได้รับโปรแบรนด์"] */
  promotionTags?: string[]
}

export interface DisplayFreeItem {
  sku: string
  name: string
  image?: string
  qty: number
  unit: string
}

export interface DisplayCartState {
  type: 'cart-update'
  items: DisplayCartItem[]
  subtotal: number
  discount: number
  grand: number
  /** ISO timestamp of last change — receiver uses to flash "last scanned" item */
  lastScannedSku?: string
  /** cashier display name */
  cashier?: string
  /** customer name if selected */
  customerName?: string
  /** member ID e.g. "C2024001" */
  memberId?: string
  /** membership level e.g. "Gold Member" */
  memberLevel?: string
  /** tier code e.g. "P3" */
  memberTier?: string
  /** promo/campaign discount total (for breakdown display) */
  promoDiscount?: number
  /** bill-end discount total */
  billDiscount?: number
  /** free / gift items earned on this bill */
  freeItems?: DisplayFreeItem[]
}

export interface DisplayIdleState {
  type: 'idle'
}

/** Shown briefly after checkout — "ขอบคุณที่ใช้บริการ" + order code. */
export interface DisplayThankYouState {
  type: 'thank-you'
  /** Order id / number to display under the thank-you message. */
  orderId: string
  /** Total amount paid (THB). */
  grand: number
  /** Customer name if selected (optional). */
  customerName?: string
  /** Earned/total reward points for this customer (optional). */
  earnedPoints?: number
}

/** Sent by CustomerDisplayScreen on mount to request an immediate state snapshot from POSScreen. */
export interface DisplayPingMessage {
  type: 'ping'
}

export type DisplayMessage = DisplayCartState | DisplayIdleState | DisplayThankYouState | DisplayPingMessage
