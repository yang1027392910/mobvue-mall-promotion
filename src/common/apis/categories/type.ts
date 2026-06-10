export interface CategoryItem {
  id: number
  name: string
  icon?: string
}

export interface RawCategoryItem {
  id?: number
  categoryId?: number
  name?: string
  categoryName?: string
  icon?: string
}

export type CategoryListResponseData = ApiResponseData<RawCategoryItem[]>
