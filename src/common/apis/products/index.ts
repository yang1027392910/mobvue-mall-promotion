import type * as Products from "./type"
import { request } from "@/http/axios"

export function getProductListApi(params: Products.ProductListRequestData) {
  return request<Products.ProductListResponseData>({
    url: "h5/product/list",
    method: "get",
    params
  })
}

export function searchProductApi(params: Products.ProductSearchRequestData) {
  return request<Products.ProductSearchResponseData>({
    url: "h5/product/search",
    method: "get",
    params
  })
}

export function getProductDetailApi(id: number | string) {
  return request<Products.ProductDetailResponseData>({
    url: `h5/product/detail/${id}`,
    method: "get"
  })
}
