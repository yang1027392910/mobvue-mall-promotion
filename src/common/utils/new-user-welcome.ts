const NEW_USER_WELCOME_KEY = "china2ph_show_new_user_welcome"

export function markNewUserWelcome() {
  window.sessionStorage.setItem(NEW_USER_WELCOME_KEY, "1")
}

export function consumeNewUserWelcome() {
  const shouldShow = window.sessionStorage.getItem(NEW_USER_WELCOME_KEY) === "1"
  window.sessionStorage.removeItem(NEW_USER_WELCOME_KEY)
  return shouldShow
}
