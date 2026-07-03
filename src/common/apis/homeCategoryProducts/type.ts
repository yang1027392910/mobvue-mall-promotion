import type { RawHotProductItem } from "@@/apis/hotProduct/type"

export interface RawHomeCategoryProductItem extends RawHotProductItem {
  categoryId?: number | string
}

export interface RawHomeCategoryProductsSection {
  id?: number | string
  categoryId?: number | string
  name?: string
  title?: string
  categoryName?: string
  alice?: string
  products: RawHomeCategoryProductItem[]
  sort?: number | string
  status?: number | string
}

export type HomeCategoryProductsResponseData = ApiResponseData<RawHomeCategoryProductsSection[]>
