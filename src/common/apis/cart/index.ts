import type { CartAddRequestData, CartListResponseData, CartUpdateRequestData } from "./type"
import { request } from "@/http/axios"

export function addCartApi(data: CartAddRequestData) {
  return request<ApiResponseData<unknown>>({ url: "h5/product/cart/add", method: "post", data })
}
export function getCartListApi() {
  return request<CartListResponseData>({ url: "h5/product/cart/list", method: "get" })
}
export function updateCartApi(data: CartUpdateRequestData) {
  return request<ApiResponseData<unknown>>({ url: "h5/product/cart/update", method: "put", data })
}
export function deleteCartApi(data: { productId: number }) {
  return request<ApiResponseData<unknown>>({ url: "h5/product/cart/delete", method: "delete", data })
}
