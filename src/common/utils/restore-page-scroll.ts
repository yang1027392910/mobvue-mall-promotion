export function restorePageScroll() {
  window.scrollTo(0, 0)
  document.body.style.position = ""
  document.body.style.top = ""
  document.body.style.overflow = ""
  document.documentElement.style.overflow = ""
}
