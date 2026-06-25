export interface LoginRequestData {
  /** admin 或 editor */
  username: string
  /** 密码 */
  password: string
}

export interface EmailCodeLoginRequestData {
  email: string
  code: string
  inviteCode?: string
}

export type SendEmailCodeResponseData = ApiResponseData<null>

export type CaptchaResponseData = ApiResponseData<string>

export type LoginResponseData = ApiResponseData<{
  token: string
  isNewUser?: boolean | number | string
  is_new_user?: boolean | number | string
  user?: {
    id?: number
    userId?: number
    user_id?: number
    sub?: number | string
    username?: string
    name?: string
    nickname?: string
    email?: string
    role?: string
    roles?: string[]
    verificationStatus?: number
    verification_status?: number
    isNewUser?: boolean | number | string
    is_new_user?: boolean | number | string
  }
}>
