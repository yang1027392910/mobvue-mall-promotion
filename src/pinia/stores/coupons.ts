import type { CouponListParams, CouponRewardsData, RawCoupon, RawCouponStatus } from "@@/apis/coupons/type"
import { getAvailableCouponsApi, getCouponListApi, getCouponRewardsApi } from "@@/apis/coupons"
import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"

export type CouponStatus = "locked" | "available" | "used" | "expired" | "disabled"

export interface Coupon {
  id: number
  type: number
  typeName: string
  title: string
  amount: number
  statusCode: RawCouponStatus
  status: CouponStatus
  statusName: string
  description: string
  validFrom: string
  validTo: string
  usedAt: string
  discountAmount: number
}

const statusMap: Record<number, CouponStatus> = {
  0: "locked",
  1: "available",
  2: "used",
  3: "expired",
  4: "disabled"
}

function amount(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function titleFor(coupon: Pick<Coupon, "type" | "typeName">) {
  if (coupon.type === 1) return "New User Coupon"
  if (coupon.type === 2) return "Verification Coupon"
  return `${coupon.typeName || "System"} Coupon`
}

function descriptionFor(coupon: Pick<Coupon, "type" | "amount">) {
  if (coupon.type === 1) return `Thank you for joining! Enjoy PHP ${coupon.amount.toFixed(2)} off your next order.`
  if (coupon.type === 2) return `Complete identity verification to get PHP ${coupon.amount.toFixed(2)} off.`
  return `Save PHP ${coupon.amount.toFixed(2)} on eligible orders.`
}

export function normalizeCoupon(raw: RawCoupon): Coupon {
  const statusCode = Number(raw.status) as RawCouponStatus
  const coupon = {
    id: Number(raw.id),
    type: Number(raw.type),
    typeName: String(raw.typeName || "System"),
    title: "",
    amount: amount(raw.amount),
    statusCode,
    status: statusMap[statusCode] || "disabled",
    statusName: String(raw.statusName || statusMap[statusCode] || "Disabled"),
    description: "",
    validFrom: String(raw.activatedAt || ""),
    validTo: String(raw.expiredAt || ""),
    usedAt: String(raw.usedAt || ""),
    discountAmount: amount(raw.discountAmount ?? raw.amount)
  }
  coupon.title = titleFor(coupon)
  coupon.description = descriptionFor(coupon)
  return coupon
}

export const useCouponsStore = defineStore("coupons", () => {
  const user = useUserStore()
  const rewards = ref<CouponRewardsData | null>(null)
  const coupons = ref<Coupon[]>([])
  const availableForOrder = ref<Coupon[]>([])
  const selectedCouponId = ref<number | null>(null)
  const lastApplied = ref<{ couponId: number, amount: number } | null>(null)
  const rewardsLoading = ref(false)
  const listLoading = ref(false)
  const availableLoading = ref(false)
  const rewardsError = ref("")
  const listError = ref("")
  const availableError = ref("")
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  let generation = 0
  let availableRequest = 0

  const selectedCoupon = computed(() => availableForOrder.value.find(coupon => coupon.id === selectedCouponId.value) || coupons.value.find(coupon => coupon.id === selectedCouponId.value) || null)
  const availableCoupons = computed(() => coupons.value.filter(coupon => coupon.statusCode === 1))
  const usedCoupons = computed(() => coupons.value.filter(coupon => coupon.statusCode === 2))
  const expiredCoupons = computed(() => coupons.value.filter(coupon => coupon.statusCode === 3))
  const availableCount = computed(() => rewards.value?.availableCount ?? availableCoupons.value.length)
  const hasMore = computed(() => coupons.value.length < total.value)

  watch(() => user.token, () => {
    generation++
    availableRequest++
    rewards.value = null
    coupons.value = []
    availableForOrder.value = []
    selectedCouponId.value = null
    lastApplied.value = null
    rewardsLoading.value = listLoading.value = availableLoading.value = false
    rewardsError.value = listError.value = availableError.value = ""
    total.value = 0
    page.value = 1
  }, { flush: "sync" })

  const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

  async function fetchRewards() {
    if (!user.token || rewardsLoading.value) return false
    const current = generation
    rewardsLoading.value = true
    rewardsError.value = ""
    try {
      const { data } = await getCouponRewardsApi()
      if (current !== generation) return false
      rewards.value = data
      return true
    } catch (error) {
      if (current === generation) rewardsError.value = message(error, "Unable to load rewards.")
      return false
    } finally {
      if (current === generation) rewardsLoading.value = false
    }
  }

  async function fetchList(params: CouponListParams = {}) {
    if (!user.token || listLoading.value) return false
    const current = generation
    const nextPage = params.page ?? 1
    listLoading.value = true
    listError.value = ""
    try {
      const { data } = await getCouponListApi({ pageSize: pageSize.value, ...params, page: nextPage })
      if (current !== generation) return false
      const rows = Array.isArray(data?.list) ? data.list : []
      const next = rows.map(normalizeCoupon).filter(coupon => Number.isSafeInteger(coupon.id) && coupon.id > 0)
      coupons.value = nextPage > 1 ? [...coupons.value, ...next] : next
      total.value = Number(data?.total ?? coupons.value.length)
      page.value = Number(data?.page ?? nextPage)
      pageSize.value = Number(data?.pageSize ?? params.pageSize ?? pageSize.value)
      return true
    } catch (error) {
      if (current === generation) listError.value = message(error, "Unable to load coupons.")
      return false
    } finally {
      if (current === generation) listLoading.value = false
    }
  }

  async function fetchAvailable(orderAmount: number) {
    const request = ++availableRequest
    const current = generation
    availableError.value = ""
    if (!user.token || orderAmount <= 0) {
      availableForOrder.value = []
      selectedCouponId.value = null
      return false
    }
    availableLoading.value = true
    try {
      const { data } = await getAvailableCouponsApi({ orderAmount: orderAmount.toFixed(2) })
      if (request !== availableRequest || current !== generation) return false
      availableForOrder.value = (Array.isArray(data) ? data : []).map(normalizeCoupon).filter(coupon => coupon.statusCode === 1)
      if (selectedCouponId.value && !availableForOrder.value.some(coupon => coupon.id === selectedCouponId.value)) selectedCouponId.value = null
      return true
    } catch (error) {
      if (request === availableRequest && current === generation) {
        availableError.value = message(error, "Unable to load available coupons.")
        availableForOrder.value = []
        selectedCouponId.value = null
      }
      return false
    } finally {
      if (request === availableRequest && current === generation) availableLoading.value = false
    }
  }

  function getCoupon(id: string | number) {
    const numericId = Number(id)
    return coupons.value.find(coupon => coupon.id === numericId) || availableForOrder.value.find(coupon => coupon.id === numericId) || null
  }

  function selectCoupon(id: string | number) {
    const coupon = availableForOrder.value.find(coupon => coupon.id === Number(id)) || coupons.value.find(coupon => coupon.id === Number(id))
    if (!coupon || coupon.statusCode !== 1) return false
    selectedCouponId.value = coupon.id
    return true
  }

  function clearSelectedCoupon() {
    selectedCouponId.value = null
  }

  function discountFor() {
    return selectedCoupon.value?.discountAmount ?? 0
  }

  function markSelectedUsed() {
    const coupon = selectedCoupon.value
    const discount = discountFor()
    if (!coupon || discount <= 0) {
      lastApplied.value = null
      return null
    }
    lastApplied.value = { couponId: coupon.id, amount: discount }
    selectedCouponId.value = null
    return lastApplied.value
  }

  return {
    rewards,
    coupons,
    availableForOrder,
    selectedCouponId,
    selectedCoupon,
    lastApplied,
    rewardsLoading,
    listLoading,
    availableLoading,
    rewardsError,
    listError,
    availableError,
    total,
    page,
    pageSize,
    hasMore,
    availableCoupons,
    usedCoupons,
    expiredCoupons,
    availableCount,
    fetchRewards,
    fetchList,
    fetchAvailable,
    getCoupon,
    selectCoupon,
    clearSelectedCoupon,
    discountFor,
    markSelectedUsed
  }
})
