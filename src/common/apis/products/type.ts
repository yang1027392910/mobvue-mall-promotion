export interface ProductItem {
  id: number
  categoryId: number
  name: string
  image: string
  phPrice: number
  isFavorite: boolean
  sales: number
  createdAt: string
}

export interface RawProductItem {
  id?: number
  productId?: number
  categoryId?: number
  name?: string
  productName?: string
  title?: string
  image?: string
  imageUrl?: string
  cover?: string
  images?: string
  subtitle?: string
  description?: string
  chinaPrice?: number | string
  shippingFee?: number | string
  otherFees?: number | string
  profit?: number | string
  stock?: number | string
  minimumOrderQuantity?: number | string
  status?: number | string
  phPrice?: number | string
  price?: number | string
  isFavorite?: boolean
  favorite?: boolean
  sales?: number | string
  salesVolume?: number | string
  createdAt?: string
  createTime?: string
  canViewSupplierContact?: boolean
  supplierContact?: {
    name?: string
    whatsapp?: string
    wechat?: string
    phone?: string
  } | null
}

export interface ProductListPageData {
  total: number
  page: number
  pageSize: number
  list: RawProductItem[]
}

export interface ProductListRequestData {
  categoryId?: number
}

export type ProductListResponseData = ApiResponseData<RawProductItem[] | ProductListPageData>
