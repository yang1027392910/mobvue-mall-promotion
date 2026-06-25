import type * as Supplier from "./type"
import { request } from "@/http/axios"

export function getSupplierListApi(params?: Supplier.SupplierListRequestData) {
  return request<Supplier.SupplierListResponseData>({
    url: "h5/supplier/list",
    method: "get",
    params
  })
}
