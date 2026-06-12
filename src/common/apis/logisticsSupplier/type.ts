export interface RawLogisticsSupplierItem {
  id: number
  name: string
  logo: string
  shippingMethod: string
  deliveryTime: string
  unitPrice: number | string
  pricingMethod: string
  sort: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface LogisticsSupplierListPageData {
  total: number
  page: number
  pageSize: number
  list: RawLogisticsSupplierItem[]
}

export interface LogisticsSupplierListRequestData {
  page?: number
  pageSize?: number
}

export type LogisticsSupplierListResponseData = ApiResponseData<LogisticsSupplierListPageData>
