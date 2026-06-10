import type { Router } from "vue-router"
import { getToken } from "@@/utils/cache/cookies"

export function isLoggedIn() {
  return Boolean(getToken())
}

export function promptLogin(router: Router) {
  router.push("/login")
}

export function requireLogin(router: Router) {
  if (isLoggedIn()) return true

  promptLogin(router)
  return false
}
