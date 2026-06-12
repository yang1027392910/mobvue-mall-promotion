export interface LoginRequestData {
  /** admin 或 editor */
  username: string
  /** 密码 */
  password: string
}

export interface EmailCodeLoginRequestData {
  email: string
  code: string
}

export type SendEmailCodeResponseData = ApiResponseData<null>

export type CaptchaResponseData = ApiResponseData<string>

export type LoginResponseData = ApiResponseData<{
  token: string
  user?: {
    username?: string
    name?: string
    nickname?: string
    email?: string
    role?: string
    roles?: string[]
  }
}>
