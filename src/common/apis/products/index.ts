import type * as Products from "./type"
import { request } from "@/http/axios"

/** 获取 H5 商品列表 */
export function getProductListApi(params: Products.ProductListRequestData) {
  return request<Products.ProductListResponseData>({
    url: "h5/product/list",
    method: "get",
    params
  })
}

/** 获取 H5 商品详情 */
export function getProductDetailApi(id: number | string) {
  return request<Products.ProductDetailResponseData>({
    url: `h5/product/detail/${id}`,
    method: "get"
  })
}
