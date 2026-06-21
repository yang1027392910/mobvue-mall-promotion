import { getCurrentUserApi } from "@@/apis/users"
import { CacheKey } from "@@/constants/cache-key"
import { setToken as _setToken, getToken, removeToken } from "@@/utils/cache/cookies"
import { pinia } from "@/pinia"

interface UserInfo {
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
}

function getStoredUserInfo(): UserInfo {
  try {
    const value = localStorage.getItem(CacheKey.USER_INFO)
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}

function setStoredUserInfo(user: UserInfo) {
  localStorage.setItem(CacheKey.USER_INFO, JSON.stringify(user))
}

function removeStoredUserInfo() {
  localStorage.removeItem(CacheKey.USER_INFO)
}

export const useUserStore = defineStore("user", () => {
  const storedUserInfo = getStoredUserInfo()
  const userInfo = ref<UserInfo>(storedUserInfo)

  const token = ref<string>(getToken() || "")
  const id = ref<number>(Number(storedUserInfo.id ?? storedUserInfo.userId ?? storedUserInfo.user_id ?? storedUserInfo.sub ?? 0))

  const roles = ref<string[]>(storedUserInfo.roles?.length ? storedUserInfo.roles : (storedUserInfo.role ? [storedUserInfo.role] : []))

  const username = ref<string>(storedUserInfo.username || storedUserInfo.name || storedUserInfo.nickname || storedUserInfo.email || "")
  const email = ref<string>(storedUserInfo.email || "")

  const setUserInfo = (user: UserInfo = {}, shouldStore = true) => {
    userInfo.value = { ...userInfo.value, ...user }
    const mergedUser = userInfo.value
    id.value = Number(mergedUser.id ?? mergedUser.userId ?? mergedUser.user_id ?? mergedUser.sub ?? 0)
    username.value = mergedUser.username || mergedUser.name || mergedUser.nickname || mergedUser.email || "h5"
    email.value = mergedUser.email || ""
    roles.value = mergedUser.roles?.length ? mergedUser.roles : (mergedUser.role ? [mergedUser.role] : ["h5"])
    if (shouldStore) {
      setStoredUserInfo(userInfo.value)
    }
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
    removeStoredUserInfo()
    token.value = ""
    id.value = 0
    roles.value = []
    username.value = ""
    email.value = ""
    userInfo.value = {}
  }

  return { token, id, roles, username, email, userInfo, setUserInfo, setToken, getInfo, changeRoles, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
