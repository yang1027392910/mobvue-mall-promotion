import type * as Categories from "./type"
import { request } from "@/http/axios"

/** 获取 H5 分类列表 */
export function getCategoryListApi() {
  return request<Categories.CategoryListResponseData>({
    url: "h5/category/list",
    method: "get"
  })
}
