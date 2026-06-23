export interface RawHomeNavigationItem {
  id?: number | string
  title?: string
  value?: string | number
  icon?: string
  sort?: number | string
  jumpType?: string
  jumpValue?: string
  color?: string
  status?: number | string
}

export interface HomeNavigationListData {
  data?: RawHomeNavigationItem[]
  list?: RawHomeNavigationItem[]
  records?: RawHomeNavigationItem[]
  rows?: RawHomeNavigationItem[]
  items?: RawHomeNavigationItem[]
}

export type HomeNavigationListResponseData = ApiResponseData<RawHomeNavigationItem[] | HomeNavigationListData>
