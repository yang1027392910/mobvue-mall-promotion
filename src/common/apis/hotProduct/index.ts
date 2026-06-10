import type * as HotProduct from "./type"
import { request } from "@/http/axios"

export function getHotProductListApi(params: HotProduct.HotProductListRequestData) {
  return request<HotProduct.HotProductListResponseData>({
    url: "h5/hotProduct/list",
    method: "get",
    params
  })
}
