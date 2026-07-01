import type { RouteLocationNormalizedLoaded, RouteMeta } from "vue-router"

const SITE_URL = "https://china2ph.com"
const SITE_NAME = "YiwuHub"
const DEFAULT_TITLE = "YiwuHub - Verified China Suppliers for Philippines Buyers"
const DEFAULT_DESCRIPTION = "YiwuHub helps Philippines buyers find verified China suppliers, compare factory prices, calculate product profits, and source wholesale goods from China."
const DEFAULT_IMAGE = `${SITE_URL}/pwa-512x512.png`

type SeoRouteMeta = RouteMeta & {
  description?: string
  robots?: string
}

function getSeoMeta(route: RouteLocationNormalizedLoaded) {
  return route.meta as SeoRouteMeta
}

function getRouteTitle(route: RouteLocationNormalizedLoaded) {
  const title = String(getSeoMeta(route).title || "").trim()
  if (!title || route.path === "/") return DEFAULT_TITLE
  return `${title} | ${SITE_NAME}`
}

function getRouteDescription(route: RouteLocationNormalizedLoaded) {
  return String(getSeoMeta(route).description || DEFAULT_DESCRIPTION)
}

function getCanonicalUrl(route: RouteLocationNormalizedLoaded) {
  return `${SITE_URL}${route.path === "/" ? "/" : route.path}`
}

function setMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.name = name
    document.head.appendChild(meta)
  }

  meta.content = content
}

function setPropertyMeta(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("property", property)
    document.head.appendChild(meta)
  }

  meta.content = content
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement("link")
    link.rel = "canonical"
    document.head.appendChild(link)
  }

  link.href = href
}

export function updateSeoMeta(route: RouteLocationNormalizedLoaded) {
  if (typeof document === "undefined") return

  const title = getRouteTitle(route)
  const description = getRouteDescription(route)
  const canonicalUrl = getCanonicalUrl(route)
  const robots = String(getSeoMeta(route).robots || "index, follow")

  document.title = title

  setMeta("description", description)
  setMeta("robots", robots)
  setMeta("twitter:title", title)
  setMeta("twitter:description", description)
  setMeta("twitter:image", DEFAULT_IMAGE)
  setCanonical(canonicalUrl)

  setPropertyMeta("og:title", title)
  setPropertyMeta("og:description", description)
  setPropertyMeta("og:url", canonicalUrl)
  setPropertyMeta("og:image", DEFAULT_IMAGE)
}
