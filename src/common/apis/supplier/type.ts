export interface RawSupplierItem {
  id: number
  name: string
  logo: string
  images?: string[] | string
  city: string
  mainProducts?: string
  main_products?: string
  moq: string
  description: string
  contactWhatsapp?: string
  contact_whatsapp?: string
  showContact?: number
  show_contact?: number
  status: number
  sort: number
}

export interface SupplierListPageData {
  total?: number
  page?: number
  pageSize?: number
  list?: RawSupplierItem[]
  data?: RawSupplierItem[]
  records?: RawSupplierItem[]
  rows?: RawSupplierItem[]
  items?: RawSupplierItem[]
}

export interface SupplierListRequestData {
  page?: number
  pageSize?: number
}

export type SupplierListResponseData = ApiResponseData<RawSupplierItem[] | SupplierListPageData>
