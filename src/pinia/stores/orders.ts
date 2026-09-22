import type { Order } from "@@/apis/orders/normalize"
import type { CreateOrderRequest } from "@@/apis/orders/type"
import { createOrderApi, getOrderDetailApi, getOrderListApi } from "@@/apis/orders"
import { normalizeOrder } from "@@/apis/orders/normalize"
import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"

export const useOrdersStore = defineStore("orders", () => {
  const user = useUserStore()
  const orders = ref<Order[]>([])
  const detail = ref<Order | null>(null)
  const listLoading = ref(false)
  const detailLoading = ref(false)
  const creating = ref(false)
  const listError = ref("")
  const detailError = ref("")
  const createError = ref("")
  const lastCreated = ref<{ id: string | null } | null>(null)
  const total = ref(0)
  const page = ref(0)
  const pageSize = ref(20)
  const hasMore = computed(() => orders.value.length < total.value)
  let generation = 0
  let detailRequest = 0
  watch(() => user.token, () => {
    generation++
    detailRequest++
    orders.value = []
    detail.value = null
    lastCreated.value = null
    total.value = 0
    page.value = 0
    listLoading.value = detailLoading.value = creating.value = false
    listError.value = detailError.value = createError.value = ""
  }, { flush: "sync" })
  const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

  async function fetchList(append = false) {
    if (listLoading.value || !user.token) return
    const current = generation
    const nextPage = append ? page.value + 1 : 1
    listLoading.value = true
    listError.value = ""
    try {
      const response = await getOrderListApi(append ? { page: nextPage, pageSize: pageSize.value } : undefined)
      const data = response.data
      const rows = Array.isArray(data) ? data : data?.list ?? data?.records
      if (!Array.isArray(rows)) throw new Error("Invalid order list response.")
      const next = rows.map(normalizeOrder)
      if (current !== generation) return
      if (append && !next.some(item => !orders.value.some(existing => existing.id === item.id))) throw new Error("Unable to load more orders. Please try again.")
      orders.value = append ? [...orders.value, ...next.filter(item => !orders.value.some(existing => existing.id === item.id))] : next
      total.value = Array.isArray(data) ? next.length : Number(data.total ?? orders.value.length)
      page.value = Array.isArray(data) ? 1 : Number(data.page ?? nextPage)
      pageSize.value = Array.isArray(data) ? 20 : Number(data.pageSize ?? (next.length || 20))
    } catch (error) {
      if (current === generation) listError.value = message(error, "Unable to load your orders.")
    } finally {
      if (current === generation) listLoading.value = false
    }
  }
  async function fetchDetail(id: string) {
    const request = ++detailRequest
    const current = generation
    detail.value = null
    detailError.value = ""
    if (!id) {
      detailError.value = "Order ID is missing. Please open the order from My Orders."
      return
    }
    if (!user.token) return
    detailLoading.value = true
    try {
      const { data } = await getOrderDetailApi(id)
      if (!data) throw new Error("Order not found.")
      const next = normalizeOrder(data)
      if (request === detailRequest && current === generation) detail.value = next
    } catch (error) {
      if (request === detailRequest && current === generation) detailError.value = message(error, "Unable to load order details.")
    } finally {
      if (request === detailRequest && current === generation) detailLoading.value = false
    }
  }
  async function create(payload: CreateOrderRequest) {
    if (creating.value) return null
    createError.value = ""
    const hasCartIds = Array.isArray(payload.cartIds) && payload.cartIds.length > 0
    const hasItems = Array.isArray(payload.items) && payload.items.length > 0
    if (!user.token || (!hasCartIds && !hasItems)) {
      createError.value = !user.token ? "Please log in before submitting your order." : "Select at least one product."
      return null
    }
    const current = generation
    creating.value = true
    try {
      const response = await createOrderApi(payload)
      // A detail-fetch failure must never trigger another create request.
      if (!response || ![0, 200].includes(response.code)) throw new Error(response?.message || "Unable to confirm order creation. Check My Orders before submitting again.")
      if (current !== generation) return null
      const data = response.data
      const rawId = typeof data === "object" && data !== null ? data.id ?? data.orderId : data
      const result = { id: typeof rawId === "number" || typeof rawId === "string" ? String(rawId) : null }
      lastCreated.value = result
      return result
    } catch (error) {
      if (current === generation) createError.value = message(error, "Unable to submit your order.")
      return null
    } finally {
      if (current === generation) creating.value = false
    }
  }
  return { orders, detail, listLoading, detailLoading, creating, listError, detailError, createError, lastCreated, hasMore, fetchList, fetchDetail, create }
})
