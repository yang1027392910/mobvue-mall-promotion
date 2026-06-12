import type * as Banner from "./type"
import { request } from "@/http/axios"

/** 获取 H5 首页 banner 列表 */
export function getBannerListApi(params?: Banner.BannerListRequestData) {
  return request<Banner.BannerListResponseData>({
    url: "h5/banner/list",
    method: "get",
    params
  })
}
