import type * as HomeNavigation from "./type"
import { request } from "@/http/axios"

/** 获取 H5 首页导航列表 */
export function getHomeNavigationListApi() {
  return request<HomeNavigation.HomeNavigationListResponseData>({
    url: "h5/homeNavigation/list",
    method: "get"
  })
}
