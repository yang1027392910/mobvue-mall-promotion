import type { RouteLocationNormalizedLoaded, RouteMeta } from "vue-router"
import { setManagedSeo } from "@/composables/useSeo"

const SITE_URL = "https://china2ph.com"
const SITE_NAME = "china2ph"
const DEFAULT_TITLE = "china2ph - Verified China Suppliers for Philippines Buyers"
const DEFAULT_DESCRIPTION = "china2ph helps Philippines buyers find verified China suppliers, compare factory prices, calculate product profits, and source wholesale goods from China."
const DEFAULT_IMAGE = `${SITE_URL}/pwa-512x512.png`

type SeoRouteMeta = RouteMeta & {
  description?: string
  dynamicSeo?: boolean
  robots?: string
  seoTitle?: string
  seoKeywords?: string | string[]
}

function getSeoMeta(route: RouteLocationNormalizedLoaded) {
  return route.meta as SeoRouteMeta
}

function getRouteTitle(route: RouteLocationNormalizedLoaded) {
  const seoTitle = String(getSeoMeta(route).seoTitle || "").trim()
  if (seoTitle) return seoTitle

  const title = String(getSeoMeta(route).title || "").trim()
  if (!title || route.path === "/") return DEFAULT_TITLE
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

function getRouteDescription(route: RouteLocationNormalizedLoaded) {
  return String(getSeoMeta(route).description || DEFAULT_DESCRIPTION)
}

function getRouteKeywords(route: RouteLocationNormalizedLoaded) {
  const keywords = getSeoMeta(route).seoKeywords

  if (Array.isArray(keywords)) {
    return keywords.map(keyword => String(keyword).trim()).filter(Boolean).join(",")
  }

  return String(keywords || "").trim()
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
  if (getSeoMeta(route).dynamicSeo) return

  const title = getRouteTitle(route)
  const description = getRouteDescription(route)
  const keywords = getRouteKeywords(route)
  const canonicalUrl = getCanonicalUrl(route)
  const robots = String(getSeoMeta(route).robots || "index, follow")

  setManagedSeo({
    title,
    description,
    keywords,
    image: DEFAULT_IMAGE,
    url: canonicalUrl
  })

  document.title = title

  setMeta("description", description)
  setMeta("keywords", keywords)
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
