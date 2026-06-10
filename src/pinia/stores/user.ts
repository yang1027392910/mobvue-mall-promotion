import { getCurrentUserApi } from "@@/apis/users"
import { setToken as _setToken, getToken, removeToken } from "@@/utils/cache/cookies"
import { pinia } from "@/pinia"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")

  const roles = ref<string[]>([])

  const username = ref<string>("")

  const setUserInfo = (user: { username?: string, role?: string, roles?: string[] }) => {
    username.value = user.username || ""
    roles.value = user.roles || (user.role ? [user.role] : [])
  }

  const setUserInfoFromToken = (value: string) => {
    try {
      const payload = value.split(".")[0]
      const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
      const decodedPayload = JSON.parse(atob(normalizedPayload))
      setUserInfo(decodedPayload)
    } catch {
      username.value = "h5"
      roles.value = ["h5"]
    }
  }

  // 设置 Token
  const setToken = (value: string, user?: { username: string, role?: string, roles?: string[] }) => {
    _setToken(value)
    if (user) {
      setUserInfo(user)
    } else {
      setUserInfoFromToken(value)
    }
    token.value = value
  }

  // 获取用户详情
  const getInfo = async () => {
    try {
      const { data } = await getCurrentUserApi()
      setUserInfo(data)
    } catch {
      if (token.value) {
        setUserInfoFromToken(token.value)
      }
    }
  }

  const changeRoles = (role: string) => {
    const newToken = `token-${role}`
    token.value = newToken
    _setToken(newToken)
    // 用刷新页面代替重新登录
    location.reload()
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
    username.value = ""
  }

  return { token, roles, username, setToken, getInfo, changeRoles, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
