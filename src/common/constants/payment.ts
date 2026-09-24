import type { Order } from "@@/apis/orders/normalize"

export interface PaymentMethod {
  id: "gcash" | "maya"
  paymentMethod: 1 | 2
  name: string
  mark: string
  accountName: string
  accountNumber: string
}

// Replace display placeholders with the merchant's verified receiving accounts.
export const paymentMethods: PaymentMethod[] = [
  { id: "gcash", paymentMethod: 1, name: "GCash", mark: "G", accountName: "Boris Store", accountNumber: "09XX XXX XXXX" },
  { id: "maya", paymentMethod: 2, name: "Maya", mark: "m", accountName: "Boris Store", accountNumber: "09XX XXX XXXX" }
]

export function canOpenPayment(order: Order | null | undefined): boolean {
  return !!order && order.statusGroup === "Pending" && (order.paymentStatus == null || order.paymentStatus === 0) && order.total !== null && Number.isFinite(order.total) && order.total > 0
}

export function hasPaymentAccount(method: PaymentMethod) {
  return !!method.accountName.trim() && /^09\d{9}$/.test(method.accountNumber.replace(/\s/g, ""))
}

export const paymentStatusViews = {
  0: { label: "I Have Paid", icon: "credit-pay", className: "is-unpaid", message: "Your payment will be verified by the seller." },
  1: { label: "Pending Verification", icon: "clock-o", className: "is-pending", message: "Your payment is awaiting seller verification." },
  2: { label: "Payment Confirmed", icon: "checked", className: "is-confirmed", message: "Thank you for your payment." }
} as const

export function getPaymentState(order: Order) {
  const status = order.paymentStatus ?? 0
  return status === 0 || status === 1 || status === 2 ? paymentStatusViews[status] : undefined
}

export function showPaymentButton(order: Order) {
  return canOpenPayment(order) || order.paymentStatus === 1 || order.paymentStatus === 2
}
