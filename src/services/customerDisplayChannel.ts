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
}

export interface DisplayIdleState {
  type: 'idle'
}

/** Sent by CustomerDisplayScreen on mount to request an immediate state snapshot from POSScreen. */
export interface DisplayPingMessage {
  type: 'ping'
}

export type DisplayMessage = DisplayCartState | DisplayIdleState | DisplayPingMessage
