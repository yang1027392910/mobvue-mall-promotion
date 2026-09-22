import type { CouponAvailableParams, CouponAvailableResponse, CouponListParams, CouponListResponse, CouponRewardsResponse } from "./type"
import { request } from "@/http/axios"

export function getCouponRewardsApi() {
  return request<CouponRewardsResponse>({ url: "h5/coupon/rewards", method: "get" })
}

export function getCouponListApi(params?: CouponListParams) {
  return request<CouponListResponse>({ url: "h5/coupon/list", method: "get", ...(params ? { params } : {}) })
}

export function getAvailableCouponsApi(params: CouponAvailableParams) {
  return request<CouponAvailableResponse>({ url: "h5/coupon/available", method: "get", params })
}
