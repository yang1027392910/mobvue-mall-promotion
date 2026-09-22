import type { CreateOrderRequest, CreateOrderResponse, OrderDetailResponse, OrderListResponse } from "./type"
import { request } from "@/http/axios"

export function createOrderApi(data: CreateOrderRequest) {
  return request<CreateOrderResponse>({ url: "h5/order/create", method: "post", data })
}
export function getOrderListApi(params?: { page: number, pageSize: number }) {
  return request<OrderListResponse>({ url: "h5/order/list", method: "get", ...(params ? { params } : {}) })
}
export function getOrderDetailApi(id: string | number) {
  return request<OrderDetailResponse>({ url: "h5/order/detail", method: "get", params: { id } })
}
