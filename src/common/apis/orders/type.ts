export interface CreateOrderRequest {
  cartIds?: number[]
  items?: Array<{ productId: number, quantity: number }>
  deliveryType?: 1 | 2
  userCouponId?: number | null
  remark?: string
}
export type RawOrder = Record<string, unknown>
export type CreateOrderResponse = ApiResponseData<RawOrder | number | string | null>
export type OrderListResponse = ApiResponseData<RawOrder[] | { list?: RawOrder[], records?: RawOrder[], total?: number, page?: number, pageSize?: number }>
export type OrderDetailResponse = ApiResponseData<RawOrder | null>
