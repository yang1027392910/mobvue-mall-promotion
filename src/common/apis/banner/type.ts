export interface RawBannerItem {
  id?: number | string
  scene?: string
  title?: string
  name?: string
  image?: string
  imageUrl?: string
  bannerUrl?: string
  picUrl?: string
  cover?: string
  url?: string
  jumpType?: string | number
  type?: string | number
  targetType?: string | number
  jumpValue?: string | number
  targetValue?: string | number
  value?: string | number
  productId?: number | string
  categoryId?: number | string
  linkUrl?: string
  link?: string
  path?: string
  sort?: number | string
  status?: number | string
}

export interface BannerListRequestData {
  scene?: string
}

export interface BannerListPageData {
  data?: RawBannerItem[]
  list?: RawBannerItem[]
  records?: RawBannerItem[]
  rows?: RawBannerItem[]
  items?: RawBannerItem[]
  total?: number
}

export type BannerListResponseData = ApiResponseData<RawBannerItem[] | BannerListPageData>
