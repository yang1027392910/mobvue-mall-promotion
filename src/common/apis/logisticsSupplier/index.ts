import type * as LogisticsSupplier from "./type"
import { request } from "@/http/axios"

/** 获取 H5 物流供应商列表 */
export function getLogisticsSupplierListApi(params?: LogisticsSupplier.LogisticsSupplierListRequestData) {
  return request<LogisticsSupplier.LogisticsSupplierListResponseData>({
    url: "h5/logisticsSupplier/list",
    method: "get",
    params
  })
}
