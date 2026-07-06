let initialized = false

export function preventDoubleTapZoom() {
  if (initialized || typeof document === "undefined") return

  initialized = true

  let lastTouchEnd = 0

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now()

      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }

      lastTouchEnd = now
    },
    { passive: false }
  )
}
