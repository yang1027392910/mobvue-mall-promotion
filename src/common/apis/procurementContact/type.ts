export interface RawProcurementContactItem {
  id: number
  contactType: string
  contactValue: string
  description: string
  sort: number
}

export interface ProcurementContactListRequestData {
  page?: number
  pageSize?: number
}

export interface ProcurementContactListPageData {
  total?: number
  page?: number
  pageSize?: number
  list: RawProcurementContactItem[]
}

export type ProcurementContactListResponseData = ApiResponseData<RawProcurementContactItem[] | ProcurementContactListPageData>
