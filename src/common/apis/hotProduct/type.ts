export type HotProductType = 1 | 2 | 3 | 4

export interface HotProductListRequestData {
  hotType: HotProductType
}

export interface RawHotProductItem {
  rating?: number | string
  categoryIcon?: string
  categoryName?: string
  category?: string | { name?: string, categoryName?: string }
  isFavorite?: boolean | number | string
  rank?: number | string
  sold?: number | string
  soldCount?: number | string
  sales?: number | string
  salesVolume?: number | string
  currentPrice?: number | string
  originalPrice?: number | string
  hotTag?: string
  id?: number
  productId?: number
  hotProductId?: number
  spuId?: number
  name?: string
  productName?: string
  goodsName?: string
  title?: string
  image?: string
  imageUrl?: string
  productImage?: string
  mainImage?: string
  picUrl?: string
  cover?: string
  coverUrl?: string
  chinaCost?: number | string
  chinaPrice?: number | string
  chinaPriceCny?: number | string
  cost?: number | string
  productCost?: number | string
  price?: number | string
  phPrice?: number | string
  salePrice?: number | string
  sellingPrice?: number | string
  profit?: number | string
  grossProfit?: number | string
  estimatedProfit?: number | string
  score?: number | string
  tiktokScore?: number | string
  tikTokScore?: number | string
  hotScore?: number | string
}

export interface HotProductListPageData {
  data?: RawHotProductItem[]
  list?: RawHotProductItem[]
  records?: RawHotProductItem[]
  rows?: RawHotProductItem[]
  items?: RawHotProductItem[]
  total?: number
}

export type HotProductListResponseData = ApiResponseData<RawHotProductItem[] | HotProductListPageData>
