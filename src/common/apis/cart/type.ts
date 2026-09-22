import type { RawProductItem } from "@@/apis/products/type"

export interface CartAddRequestData {
  productId: number
  quantity: number
}
export interface CartUpdateRequestData extends CartAddRequestData {
  checked: 0 | 1
}
export interface RawCartItem extends Omit<RawProductItem, "id" | "productId"> {
  id?: number | string
  cartId?: number | string
  productId?: number | string
  product?: RawProductItem
  quantity: number | string
  checked: number | string | boolean
}
export type CartListResponseData = ApiResponseData<RawCartItem[] | { list: RawCartItem[] }>
