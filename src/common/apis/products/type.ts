export interface ProductItem {
  id: number
  categoryId: number
  name: string
  image: string
  chinaCost?: number
  phPrice: number
  profit?: number
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
  images?: string | string[]
  subtitle?: string
  description?: string
  chinaCost?: number | string
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
  showSupplierContact?: boolean | number | string
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

export type ProductDetailResponseData = ApiResponseData<RawProductItem>
