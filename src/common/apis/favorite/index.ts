import type * as Favorite from "./type"
import { request } from "@/http/axios"

/** 商品收藏/取消收藏 */
export function favoriteClickApi(data: Favorite.FavoriteClickRequestData) {
  return request<Favorite.FavoriteClickResponseData>({
    url: "h5/favorite/click",
    method: "post",
    data
  })
}

/** 获取 H5 收藏列表 */
export function getFavoriteListApi(params: Favorite.FavoriteListRequestData) {
  return request<Favorite.FavoriteListResponseData>({
    url: "h5/favorite/list",
    method: "get",
    params
  })
}
