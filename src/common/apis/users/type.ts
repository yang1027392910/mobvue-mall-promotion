export type CurrentUserResponseData = ApiResponseData<{
  id?: number
  userId?: number
  user_id?: number
  sub?: number | string
  username?: string
  nickname?: string
  email?: string
  role?: string
  roles?: string[]
  status?: number
  verificationStatus?: number
}>
