import type * as ProcurementContact from "./type"
import { request } from "@/http/axios"

/** 获取 H5 采购客服联系方式列表 */
export function getProcurementContactListApi(params: ProcurementContact.ProcurementContactListRequestData) {
  return request<ProcurementContact.ProcurementContactListResponseData>({
    url: "h5/procurement-contact/list",
    method: "get",
    params
  })
}
