import { getCurrentUserApi } from "@@/apis/users"
import { setToken as _setToken, getToken, removeToken } from "@@/utils/cache/cookies"
import { pinia } from "@/pinia"

interface UserInfo {
  username?: string
  name?: string
  nickname?: string
  email?: string
  role?: string
  roles?: string[]
}

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")

  const roles = ref<string[]>([])

  const username = ref<string>("")

  const setUserInfo = (user: UserInfo = {}) => {
    username.value = user.username || user.name || user.nickname || user.email || "h5"
    roles.value = user.roles?.length ? user.roles : (user.role ? [user.role] : ["h5"])
  }

  const setUserInfoFromToken = (value: string) => {
    try {
      const payload = value.split(".")[1] || value.split(".")[0]
      const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
      const decodedPayload = JSON.parse(atob(normalizedPayload))
      setUserInfo(decodedPayload)
    } catch {
      setUserInfo()
    }
  }

  // 设置 Token
  const setToken = (value: string, user?: UserInfo) => {
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
