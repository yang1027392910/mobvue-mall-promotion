import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取 H5 当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "h5/user/detail",
    method: "get"
  })
}
