import type { RawProductItem } from "@@/apis/products/type"

export interface FavoriteClickRequestData {
  productId: number
}

export interface FavoriteListRequestData {
  page?: number
  pageSize?: number
}

export interface RawFavoriteItem extends Partial<RawProductItem> {
  product?: RawProductItem
  productId?: number
}

export interface FavoriteListPageData {
  total: number
  page: number
  pageSize: number
  list: RawFavoriteItem[]
}

export type FavoriteClickResponseData = ApiResponseData<unknown>
export type FavoriteListResponseData = ApiResponseData<FavoriteListPageData>
