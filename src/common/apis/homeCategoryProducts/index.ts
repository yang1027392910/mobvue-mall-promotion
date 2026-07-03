import type * as HomeCategoryProducts from "./type"
import { request } from "@/http/axios"

export function getHomeCategoryProductsApi() {
  return request<HomeCategoryProducts.HomeCategoryProductsResponseData>({
    url: "h5/home/category-products",
    method: "get"
  })
}
