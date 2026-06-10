import type * as Auth from "./type"
import { request } from "@/http/axios"

/** 获取登录验证码 */
export function getCaptchaApi() {
  return request<Auth.CaptchaResponseData>({
    url: "auth/captcha",
    method: "get"
  })
}

/** 登录并返回 Token */
export function loginApi(data: Auth.LoginRequestData) {
  return request<Auth.LoginResponseData>({
    url: "h5/login",
    method: "post",
    data
  })
}

export function sendEmailCode(email: string) {
  return request<Auth.SendEmailCodeResponseData>({
    url: "h5/email-code/send",
    method: "post",
    data: { email }
  })
}

export function emailCodeLogin(data: Auth.EmailCodeLoginRequestData) {
  return request<Auth.LoginResponseData>({
    url: "h5/email-code/login",
    method: "post",
    data
  })
}
