const TAWK_SCRIPT_ID = "tawk-to-script"
const TAWK_SCRIPT_SRC = "https://embed.tawk.to/6a44ab0f8642321d48551681/1jse3odha"

type TawkApi = {
  hideWidget?: () => void
  maximize?: () => void
  showWidget?: () => void
  onChatEnded?: () => void
  onChatHidden?: () => void
  onChatMinimized?: () => void
  onLoad?: () => void
  onUnreadCountChanged?: (count: number) => void
}

declare global {
  interface Window {
    Tawk_API?: TawkApi
    Tawk_LoadStart?: Date
  }
}

let tawkLoadPromise: Promise<void> | null = null

function hideTawkLauncher() {
  window.Tawk_API?.hideWidget?.()
}

function showTawkLauncher() {
  window.Tawk_API?.showWidget?.()
}

export function loadTawkTo() {
  if (typeof window === "undefined") return Promise.resolve()

  if (window.Tawk_API?.maximize) return Promise.resolve()
  if (tawkLoadPromise) return tawkLoadPromise

  window.Tawk_API = window.Tawk_API || {}
  window.Tawk_LoadStart = window.Tawk_LoadStart || new Date()

  tawkLoadPromise = new Promise<void>((resolve, reject) => {
    const tawkApi = window.Tawk_API || {}
    const existingOnChatEnded = tawkApi.onChatEnded
    const existingOnChatHidden = tawkApi.onChatHidden
    const existingOnChatMinimized = tawkApi.onChatMinimized
    const existingOnLoad = tawkApi.onLoad
    const existingOnUnreadCountChanged = tawkApi.onUnreadCountChanged

    tawkApi.onChatEnded = () => {
      existingOnChatEnded?.()
      hideTawkLauncher()
    }
    tawkApi.onChatHidden = () => {
      existingOnChatHidden?.()
      hideTawkLauncher()
    }
    tawkApi.onChatMinimized = () => {
      existingOnChatMinimized?.()
      hideTawkLauncher()
    }
    tawkApi.onLoad = () => {
      existingOnLoad?.()
      hideTawkLauncher()
      resolve()
    }
    tawkApi.onUnreadCountChanged = (count) => {
      existingOnUnreadCountChanged?.(count)
      if (count > 0) showTawkLauncher()
    }
    window.Tawk_API = tawkApi

    const existingScript = document.getElementById(TAWK_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement("script")
    const firstScript = document.getElementsByTagName("script")[0]

    script.id = TAWK_SCRIPT_ID
    script.async = true
    script.src = TAWK_SCRIPT_SRC
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")
    script.onerror = () => {
      tawkLoadPromise = null
      reject(new Error("Failed to load Tawk.to"))
    }

    firstScript.parentNode?.insertBefore(script, firstScript)
  })

  return tawkLoadPromise
}

export async function openTawkChat() {
  await loadTawkTo()
  showTawkLauncher()
  window.Tawk_API?.maximize?.()
}
