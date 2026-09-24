import type { RawOrder } from "./type"

export interface OrderLine {
  saleType?: number | string | null
  id: string
  title: string
  image: string
  price: number | null
  quantity: number
  amount: number | null
}
export interface Order {
  paymentStatus?: number | null
  paymentMethod?: number | null
  paymentReference?: string
  id: string
  orderNo: string
  createdAt: string
  status: string
  statusGroup: string
  delivery: string
  discount: number | null
  shipping: number | null
  subtotal: number | null
  total: number | null
  itemCount: number
  remark: string
  productImages: string[]
  items: OrderLine[]
}
export const orderStatusMap = {
  0: "Pending",
  1: "Confirmed",
  2: "Processing",
  3: "Completed",
  4: "Cancelled"
} as const
export const orderStatuses = ["All", "Pending", "Completed", "Cancelled"] as const
function record(value: unknown): RawOrder {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RawOrder : {}
}
function amount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
function assetUrl(value: unknown) {
  const image = String(value ?? "")
  return !image || /^https?:\/\//.test(image) ? image : `${(import.meta.env.VITE_IMAGE_BASE_URL || "").replace(/\/$/, "")}/${image.replace(/^\//, "")}`
}
export function normalizeOrder(raw: RawOrder): Order {
  const id = String(raw.id ?? raw.orderId ?? "")
  if (!id) throw new Error("The order response is missing its ID.")
  const rawItems = raw.items ?? raw.orderItems ?? []
  if (!Array.isArray(rawItems)) throw new Error("Invalid order items response.")
  const items = rawItems.map((value, index): OrderLine => {
    const item = record(value)
    const product = record(item.product)
    const price = amount(item.unitPrice ?? item.price ?? item.phPrice ?? product.phPrice ?? product.price)
    const quantity = amount(item.quantity) ?? 0
    return {
      id: String(item.productId ?? product.id ?? item.id ?? index),
      saleType: typeof (item.saleType ?? product.saleType) === "string" || typeof (item.saleType ?? product.saleType) === "number" ? (item.saleType ?? product.saleType) as string | number : undefined,
      title: String(item.productName ?? item.name ?? item.title ?? product.name ?? product.title ?? "Product"),
      image: assetUrl(item.productImage ?? item.productCover ?? item.cover ?? item.image ?? item.imageUrl ?? product.cover ?? product.image),
      price,
      quantity,
      amount: amount(item.subtotal ?? item.totalAmount ?? item.amount) ?? (price === null ? null : Math.round(price * 100) * quantity / 100)
    }
  })
  const statusText = String(raw.statusName ?? raw.statusText ?? raw.orderStatusName ?? raw.status ?? raw.orderStatus ?? "")
  const statusCode = String(raw.status ?? raw.orderStatus ?? "").trim()
  const numericStatus = Object.entries(orderStatusMap).find(([code]) => code === statusCode)?.[1]
  const knownStatus = numericStatus ?? Object.values(orderStatusMap).find(status => status.toLowerCase() === statusText.trim().toLowerCase())
  const statusGroup = knownStatus === "Confirmed" || knownStatus === "Processing" ? "Pending" : knownStatus
  // Unknown status codes remain visible; delivery enums are not mapped yet.
  const status = statusGroup ?? (statusText ? (/^\d+$/.test(statusText) ? `Status ${statusText}` : statusText) : "To be confirmed")
  const deliveryText = raw.deliveryTypeName ?? raw.deliveryTypeText ?? raw.deliveryName
  const delivery = String(deliveryText ?? (raw.deliveryType == null ? "To be confirmed" : `Type ${raw.deliveryType}`))
  const subtotal = amount(raw.subtotalAmount ?? raw.subtotal ?? raw.productAmount ?? raw.goodsAmount)
    ?? (items.length && items.every(item => item.amount !== null) ? items.reduce((sum, item) => sum + Math.round(item.amount! * 100), 0) / 100 : null)
  const discount = amount(raw.discountAmount ?? raw.discount)
  const shipping = amount(raw.shippingFee)
  return {
    id,
    paymentStatus: amount(raw.paymentStatus ?? raw.payment_status),
    paymentMethod: amount(raw.paymentMethod ?? raw.payment_method),
    paymentReference: String(raw.paymentReference ?? raw.payment_reference ?? raw.referenceNo ?? ""),
    orderNo: String(raw.orderNo ?? raw.orderNumber ?? id),
    createdAt: String(raw.createdAt ?? raw.createTime ?? raw.createdTime ?? ""),
    status,
    statusGroup: statusGroup ?? "Unknown",
    delivery,
    subtotal,
    discount,
    shipping,
    total: amount(raw.payAmount ?? raw.totalAmount ?? raw.actualAmount ?? raw.total)
      ?? (subtotal !== null && discount !== null && shipping !== null ? Math.round((subtotal - discount + shipping) * 100) / 100 : null),
    itemCount: amount(raw.itemCount ?? raw.productCount) ?? items.length,
    remark: String(raw.remark ?? ""),
    productImages: Array.isArray(raw.productImages) ? raw.productImages.filter((image): image is string => typeof image === "string" && !!image.trim()).map(image => assetUrl(image.trim())) : items.map(item => item.image).filter(Boolean),
    items
  }
}
export const formatOrderMoney = (value: number | null) => value === null ? "--" : `${String.fromCharCode(8369)}${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const orderSubtotal = (order: Order) => order.subtotal
export const orderTotal = (order: Order) => order.total
export function formatOrderDate(value: string) {
  if (!value) return "--"
  const date = new Date(value.replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T"))
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`
}
