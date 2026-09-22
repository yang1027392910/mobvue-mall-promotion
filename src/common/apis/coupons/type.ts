export type RawCouponStatus = 0 | 1 | 2 | 3 | 4
export type RawCouponType = 1 | 2 | 3

export interface RawCoupon {
  id: number | string
  type: RawCouponType | number
  typeName: string
  amount: string
  status: RawCouponStatus | number
  statusName: string
  activatedAt: string | null
  expiredAt: string | null
  usedAt?: string | null
  discountAmount?: string | null
}

export interface CouponRewardsData {
  registration: RawCoupon | null
  verification: RawCoupon | null
  availableCount: number
}

export interface CouponListData {
  total: number
  page: number
  pageSize: number
  list: RawCoupon[]
}

export interface CouponListParams {
  status?: RawCouponStatus
  page?: number
  pageSize?: number
}

export interface CouponAvailableParams {
  orderAmount: string
}

export type CouponRewardsResponse = ApiResponseData<CouponRewardsData>
export type CouponListResponse = ApiResponseData<CouponListData>
export type CouponAvailableResponse = ApiResponseData<RawCoupon[]>
