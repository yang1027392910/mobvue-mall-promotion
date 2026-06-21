export interface UserVerificationSubmitResponseData {
  id: number
  full_name?: string
  fullName?: string
  phone: string
  email?: string
  address: string
  city: string
  shop_name?: string
  shopName?: string
  business_type?: string
  businessType?: string
  store_description?: string
  storeDescription?: string
  store_photos?: string[] | string
  storePhotos?: string[] | string
  remark: string
  created_at: string
  status?: number | string
  review_status?: number | string
  audit_status?: number | string
}

export interface UserVerificationSubmitRequestData {
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  shop_name: string
  business_type: string
  store_description: string
  store_photos: string[]
  remark: string
}

export type UserVerificationResponseData = ApiResponseData<UserVerificationSubmitResponseData>
export type UserVerificationDetailResponseData = ApiResponseData<UserVerificationSubmitResponseData | null>

export type UploadResponseData = ApiResponseData<string | {
  url?: string
  path?: string
  fileUrl?: string
  file_url?: string
}>
