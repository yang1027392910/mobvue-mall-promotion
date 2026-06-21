import type * as UserVerification from "./type"
import { request } from "@/http/axios"

export function submitUserVerificationApi(data: UserVerification.UserVerificationSubmitRequestData) {
  return request<UserVerification.UserVerificationResponseData>({
    url: "h5/user/verification/submit",
    method: "post",
    data,
    timeout: 30000
  })
}

export function getUserVerificationDetailApi(userId: number) {
  return request<UserVerification.UserVerificationDetailResponseData>({
    url: "h5/user-verification/detail",
    method: "get",
    params: { userId }
  })
}

export function uploadFileApi(file: File) {
  const data = new FormData()
  data.append("file", file, file.name)

  return request<UserVerification.UploadResponseData>({
    url: "h5/upload",
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data,
    timeout: 30000
  })
}
