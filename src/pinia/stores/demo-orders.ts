import { defineStore } from "pinia"
import { ref } from "vue"
import dressImage from "@/assets/categories/category_dress.png"
import shoeImage from "@/assets/categories/category_shoe.png"

export type OrderStatus = "Pending" | "Confirmed" | "Completed"
export interface OrderLine {
  id: number
  title: string
  image: string
  price: number
  quantity: number
}
export interface DemoOrder {
  id: string
  createdAt: string
  status: OrderStatus
  delivery: string
  discount: number
  shipping: number | null
  items: OrderLine[]
}
export const orderStatuses = ["All", "Pending", "Confirmed", "Completed"] as const
export const formatOrderMoney = (value: number) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const orderSubtotal = (order: DemoOrder) => order.items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100
export const orderTotal = (order: DemoOrder) => orderSubtotal(order) - order.discount + (order.shipping ?? 0)
export function formatOrderDate(value: string) {
  const date = new Date(value)
  return `${date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`
}
const demoItems: OrderLine[] = [
  { id: 1001, title: "连衣裙", image: dressImage, price: 500, quantity: 1 },
  { id: 1002, title: "shoes", image: shoeImage, price: 180, quantity: 1 },
  { id: 1003, title: "Headphones boy", image: "", price: 180, quantity: 2 }
]
function sampleOrders(): DemoOrder[] {
  return [
    { id: "202509200001", createdAt: "2025-09-20T14:30:00", status: "Pending", delivery: "Self Pickup", discount: 0, shipping: null, items: demoItems.map(item => ({ ...item })) },
    { id: "202509180002", createdAt: "2025-09-18T10:20:00", status: "Confirmed", delivery: "Self Pickup", discount: 0, shipping: 0, items: demoItems.slice(0, 2).map(item => ({ ...item })) },
    { id: "202509150001", createdAt: "2025-09-15T09:12:00", status: "Completed", delivery: "Self Pickup", discount: 0, shipping: 0, items: [{ ...demoItems[1], quantity: 1 }] }
  ]
}
// Demo orders never call an order API or remove products from the real cart.
export const useDemoOrdersStore = defineStore("demo-orders", () => {
  const orders = ref<DemoOrder[]>(sampleOrders())
  function submit(items: OrderLine[]) {
    if (!items.length) return null
    const date = new Date()
    const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
    let sequence = orders.value.filter(order => order.id.startsWith(day)).length + 1
    while (orders.value.some(order => order.id === `${day}${String(sequence).padStart(4, "0")}`)) sequence++
    const order: DemoOrder = {
      id: `${day}${String(sequence).padStart(4, "0")}`,
      createdAt: date.toISOString(),
      status: "Pending",
      delivery: "Self Pickup",
      discount: 0,
      shipping: null,
      items: items.map(({ id, title, image, price, quantity }) => ({ id, title, image, price, quantity }))
    }
    orders.value.unshift(order)
    return order
  }
  return { orders, submit }
})
